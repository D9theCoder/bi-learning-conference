<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendMessageRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\TutorMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    /**
     * Display the messages page with thread list and active conversation.
     * Admins see all tutor-student conversations, regular users see only their own.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Check if user has admin role (RBAC permission check)
        $isAdmin = $user->hasRole('admin');

        // Query params for navigation: partner (for regular users), tutor_id/student_id (for admins)
        $partnerId = $request->query('partner');
        $tutorId = $request->query('tutor_id');
        $studentId = $request->query('student_id');

        // Load thread list based on role
        $threads = $isAdmin
            ? $this->threadsForAdmin()
            : $this->threadsForParticipant($user);

        // Load active conversation based on role and query params
        $activeThread = $isAdmin
            ? $this->activeThreadForAdmin($tutorId, $studentId)
            : ($partnerId ? $this->activeThreadForParticipant($user, (int) $partnerId) : null);

        return Inertia::render('messages/index', [
            'threads' => $threads,
            'activeThread' => $activeThread,
            'isAdmin' => $isAdmin,
            'currentUserId' => $user->id,
            'contacts' => $isAdmin ? [] : $this->contactsForParticipant($user),
        ]);
    }

    /**
     * Poll endpoint for real-time message updates.
     * Returns updated threads and active conversation without full page reload.
     */
    public function poll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check admin role for permission-based data filtering
        $isAdmin = $user->hasRole('admin');

        $partnerId = $request->query('partner');
        $tutorId = $request->query('tutor_id');
        $studentId = $request->query('student_id');

        $threads = $isAdmin
            ? $this->threadsForAdmin()
            : $this->threadsForParticipant($user);

        $activeThread = $isAdmin
            ? $this->activeThreadForAdmin($tutorId, $studentId)
            : ($partnerId ? $this->activeThreadForParticipant($user, (int) $partnerId) : null);

        return response()->json([
            'threads' => $threads,
            'activeThread' => $activeThread,
            'contacts' => $isAdmin ? [] : $this->contactsForParticipant($user),
        ]);
    }

    /**
     * Store a new message in the conversation.
     * Admins are blocked from sending messages (read-only access).
     */
    public function store(SendMessageRequest $request): RedirectResponse
    {
        $user = $request->user();
        $partnerId = $request->input('partner_id');

        // RBAC: Block admins from sending messages (they can only observe)
        if ($user->hasRole('admin')) {
            abort(403, 'Admins cannot send messages.');
        }

        $partner = User::findOrFail($partnerId);

        // Validate that one is a tutor and one is a student
        $this->ensureParticipantsAreTutorAndStudent($user, $partner);

        // Find existing conversation to maintain consistent tutor_id/user_id orientation
        $existingMessage = TutorMessage::where(function ($q) use ($user, $partnerId) {
            $q->where('tutor_id', $user->id)->where('user_id', $partnerId);
        })->orWhere(function ($q) use ($user, $partnerId) {
            $q->where('tutor_id', $partnerId)->where('user_id', $user->id);
        })->first();

        if ($existingMessage) {
            // Reuse existing conversation's tutor_id/user_id to maintain consistency
            $tutorId = $existingMessage->tutor_id;
            $userId = $existingMessage->user_id;
        } else {
            // New conversation: determine who is tutor and who is student
            $userRole = $this->roleForConversation($user);
            $partnerRole = $this->roleForConversation($partner);

            if ($userRole === 'tutor' && $partnerRole === 'student') {
                $tutorId = $user->id;
                $userId = $partnerId;
            } elseif ($userRole === 'student' && $partnerRole === 'tutor') {
                $tutorId = $partnerId;
                $userId = $user->id;
            } else {
                // Invalid: both have same role or neither has valid role
                abort(403, 'Messages are limited to tutor-student conversations.');
            }
        }

        // Verify student is enrolled in a course taught by the tutor
        $this->ensureEnrollmentBetween($tutorId, $userId);

        TutorMessage::create([
            'tutor_id' => $tutorId,
            'user_id' => $userId,
            'sender_id' => $user->id,
            'content' => $request->input('content'),
            'sent_at' => now(),
            'is_read' => false,
        ]);

        return back()->with('message', 'Message sent!');
    }

    /**
     * Get conversation threads for regular users (tutors/students).
     * Returns list of conversations with partner info, latest message time, and unread count.
     */
    private function threadsForParticipant(User $user): Collection
    {
        $adminIds = $this->adminIds();

        // Raw query to find all conversations involving this user
        // partner_id = the other person in the conversation
        $threads = DB::table('tutor_messages')
            ->selectRaw(
                'CASE WHEN tutor_id = ? THEN user_id ELSE tutor_id END as partner_id',
                [$user->id]
            )
            ->selectRaw('MAX(sent_at) as latest_message_at')
            ->selectRaw(
                'SUM(CASE WHEN user_id = ? AND is_read = false THEN 1 ELSE 0 END) as unread_count',
                [$user->id]
            )
            ->where(function ($q) use ($user) {
                $q->where('tutor_id', $user->id)
                    ->orWhere('user_id', $user->id);
            })
            ->when($adminIds->isNotEmpty(), function ($query) use ($adminIds) {
                $query->whereNotIn('tutor_id', $adminIds)
                    ->whereNotIn('user_id', $adminIds);
            })
            ->groupBy('partner_id')
            ->orderByDesc('latest_message_at')
            ->get();

        // Eager load all partner users in one query
        $partners = User::whereIn('id', $threads->pluck('partner_id'))->get()->keyBy('id');

        return $threads->map(function ($thread) use ($partners) {
            $partner = $partners->get($thread->partner_id);

            return [
                'partner' => [
                    'id' => $partner?->id,
                    'name' => $partner?->name,
                    'avatar' => $partner?->avatar,
                ],
                'latest_message_at' => $thread->latest_message_at,
                'unread_count' => (int) $thread->unread_count,
            ];
        })->filter(fn ($thread) => ! empty($thread['partner']['id']))->values();
    }

    /**
     * Get all conversation threads for admin view.
     * Returns all tutor-student conversations with both participants' info.
     */
    private function threadsForAdmin(): Collection
    {
        $adminIds = $this->adminIds();

        // Group by tutor_id and user_id to get unique conversations
        $threads = TutorMessage::query()
            ->select('tutor_id', 'user_id')
            ->selectRaw('MAX(sent_at) as latest_message_at')
            ->selectRaw('SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count')
            ->when($adminIds->isNotEmpty(), function ($query) use ($adminIds) {
                $query->whereNotIn('tutor_id', $adminIds)
                    ->whereNotIn('user_id', $adminIds);
            })
            ->groupBy('tutor_id', 'user_id')
            ->orderByDesc('latest_message_at')
            ->get();

        // Eager load all involved users (both tutors and students)
        $userIds = $threads->pluck('tutor_id')->merge($threads->pluck('user_id'))->unique();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        return $threads->map(function ($thread) use ($users) {
            $tutor = $users->get($thread->tutor_id);
            $student = $users->get($thread->user_id);

            return [
                'id' => "{$thread->tutor_id}-{$thread->user_id}",
                'tutor' => [
                    'id' => $tutor?->id,
                    'name' => $tutor?->name,
                    'avatar' => $tutor?->avatar,
                ],
                'student' => [
                    'id' => $student?->id,
                    'name' => $student?->name,
                    'avatar' => $student?->avatar,
                ],
                'latest_message_at' => $thread->latest_message_at,
                'unread_count' => (int) $thread->unread_count,
            ];
        })->filter(fn ($thread) => $thread['tutor']['id'] && $thread['student']['id'])->values();
    }

    /**
     * Get active conversation for regular user with a specific partner.
     * Marks messages as read and returns paginated message history.
     */
    private function activeThreadForParticipant(User $user, int $partnerId): ?array
    {
        $partner = User::find($partnerId);

        if (! $partner) {
            return null;
        }

        // Verify this is a valid tutor-student conversation
        $this->ensureParticipantsAreTutorAndStudent($user, $partner);

        // Load messages in both directions (user→partner and partner→user)
        $messages = TutorMessage::where(function ($q) use ($user, $partnerId) {
            $q->where('tutor_id', $user->id)->where('user_id', $partnerId);
        })->orWhere(function ($q) use ($user, $partnerId) {
            $q->where('tutor_id', $partnerId)->where('user_id', $user->id);
        })
            ->orderBy('sent_at')
            ->orderBy('id')
            ->paginate(50);

        // Mark messages as read based on user's role
        if ($this->isStudentUser($user)) {
            // Student reading tutor's messages
            TutorMessage::where('user_id', $user->id)
                ->where('tutor_id', $partnerId)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        } elseif ($this->isTutorUser($user)) {
            // Tutor reading student's messages
            TutorMessage::where('tutor_id', $user->id)
                ->where('user_id', $partnerId)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'avatar' => $partner->avatar,
            ],
            'messages' => $messages,
        ];
    }

    /**
     * Get active conversation for admin view between specific tutor and student.
     * Admin can view any conversation but messages are not marked as read.
     */
    private function activeThreadForAdmin(?int $tutorId, ?int $studentId): ?array
    {
        if (! $tutorId || ! $studentId) {
            return null;
        }

        $tutor = User::find($tutorId);
        $student = User::find($studentId);

        if (! $tutor || ! $student) {
            return null;
        }

        if ($tutor->hasRole('admin') || $student->hasRole('admin')) {
            return null;
        }

        // Load messages for this specific tutor-student pair
        $messages = TutorMessage::where('tutor_id', $tutorId)
            ->where('user_id', $studentId)
            ->orderBy('sent_at')
            ->orderBy('id')
            ->paginate(50);

        return [
            'tutor' => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'avatar' => $tutor->avatar,
            ],
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'avatar' => $student->avatar,
            ],
            'messages' => $messages,
        ];
    }

    /**
     * Validate that participants are one tutor and one student (not same role).
     */
    private function ensureParticipantsAreTutorAndStudent(User $user, User $partner): void
    {
        $userRole = $this->roleForConversation($user);
        $partnerRole = $this->roleForConversation($partner);

        if (! $userRole || ! $partnerRole || $userRole === $partnerRole) {
            abort(403, 'Messages are limited to tutor-student conversations.');
        }
    }

    /**
     * Verify that student is enrolled in a course taught by the tutor.
     * Prevents messaging between unrelated tutors and students.
     */
    private function ensureEnrollmentBetween(int $tutorId, int $studentId): void
    {
        // Check if student is enrolled in any course by this tutor
        $hasEnrollment = Enrollment::where('user_id', $studentId)
            ->whereHas('course', fn ($q) => $q->where('instructor_id', $tutorId))
            ->exists();

        // Legacy fallback for historical data with reversed IDs
        $legacyEnrollment = Enrollment::where('user_id', $tutorId)
            ->whereHas('course', fn ($q) => $q->where('instructor_id', $studentId))
            ->exists();

        if (! $hasEnrollment && ! $legacyEnrollment) {
            abort(403, 'You can only message tutors or students within your enrolled courses.');
        }
    }

    /**
     * Get list of available contacts for regular user to start conversations.
     * Students see their tutors, tutors see their students.
     */
    private function contactsForParticipant(User $user): Collection
    {
        $contacts = collect();

        if ($this->isStudentUser($user)) {
            // Get all tutors from courses the student is enrolled in
            $enrollments = Enrollment::with('course.instructor')
                ->where('user_id', $user->id)
                ->get();

            $studentContacts = $enrollments->pluck('course.instructor')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn (User $tutor) => [
                    'id' => $tutor->id,
                    'name' => $tutor->name,
                    'avatar' => $tutor->avatar,
                    'role' => 'tutor',
                ]);

            $contacts = $contacts->merge($studentContacts);
        }

        if ($this->isTutorUser($user)) {
            // Get all students enrolled in courses taught by this tutor
            $enrollments = Enrollment::with('user')
                ->whereHas('course', fn ($q) => $q->where('instructor_id', $user->id))
                ->get();

            $tutorContacts = $enrollments->pluck('user')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn (User $student) => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'avatar' => $student->avatar,
                    'role' => 'student',
                ]);

            $contacts = $contacts->merge($tutorContacts);
        }

        return $contacts->unique('id')->values();
    }

    /**
     * Determine user's role in messaging context (tutor or student).
     */
    private function roleForConversation(User $user): ?string
    {
        if ($this->isTutorUser($user)) {
            return 'tutor';
        }

        if ($this->isStudentUser($user)) {
            return 'student';
        }

        return null;
    }

    /**
     * Check if user is a tutor (has tutor role OR has created courses).
     */
    private function isTutorUser(User $user): bool
    {
        if ($user->hasRole('tutor')) {
            return true;
        }

        // Also consider users who have created courses as tutors
        return Course::where('instructor_id', $user->id)->exists();
    }

    /**
     * Check if user is a student (has student role).
     */
    private function isStudentUser(User $user): bool
    {
        return $user->hasRole('student');
    }

    private function adminIds(): Collection
    {
        return User::role('admin')->pluck('id');
    }
}
