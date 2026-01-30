<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendAdminTutorMessageRequest;
use App\Models\Course;
use App\Models\TutorMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AdminTutorMessageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $isAdmin = $user->hasRole('admin');
        $isTutor = $this->isTutorUser($user);

        if (! $isAdmin && ! $isTutor) {
            abort(403);
        }

        $tutorId = $request->integer('tutor_id');
        $adminId = $request->integer('admin_id');

        $threads = $isAdmin
            ? $this->threadsForAdmin($user)
            : $this->threadsForTutor($user);

        $activeThread = $isAdmin
            ? ($tutorId ? $this->activeThreadForAdmin($user, $tutorId) : null)
            : ($adminId ? $this->activeThreadForTutor($user, $adminId) : null);

        $tutors = $isAdmin ? $this->tutorsForAdmin() : collect();

        return Inertia::render('admin-messages/index', [
            'threads' => $threads,
            'activeThread' => $activeThread,
            'isAdmin' => $isAdmin,
            'currentUserId' => $user->id,
            'tutors' => $tutors,
        ]);
    }

    public function poll(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $isAdmin = $user->hasRole('admin');
        $isTutor = $this->isTutorUser($user);

        if (! $isAdmin && ! $isTutor) {
            abort(403);
        }

        $tutorId = $request->integer('tutor_id');
        $adminId = $request->integer('admin_id');

        $threads = $isAdmin
            ? $this->threadsForAdmin($user)
            : $this->threadsForTutor($user);

        $activeThread = $isAdmin
            ? ($tutorId ? $this->activeThreadForAdmin($user, $tutorId) : null)
            : ($adminId ? $this->activeThreadForTutor($user, $adminId) : null);

        $tutors = $isAdmin ? $this->tutorsForAdmin() : collect();

        return response()->json([
            'threads' => $threads,
            'activeThread' => $activeThread,
            'tutors' => $tutors,
        ]);
    }

    public function store(SendAdminTutorMessageRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $isAdmin = $user->hasRole('admin');

        if ($isAdmin) {
            $tutorId = (int) $request->input('tutor_id');
            $tutor = User::findOrFail($tutorId);

            if (! $this->isTutorUser($tutor)) {
                abort(403, 'Selected user is not a tutor.');
            }

            $adminId = $user->id;
        } else {
            $adminId = (int) $request->input('admin_id');
            $admin = User::findOrFail($adminId);

            if (! $admin->hasRole('admin')) {
                abort(403, 'Selected user is not an admin.');
            }

            $tutorId = $user->id;
        }

        TutorMessage::create([
            'tutor_id' => $tutorId,
            'user_id' => $adminId,
            'sender_id' => $user->id,
            'content' => $request->input('content'),
            'sent_at' => now(),
            'is_read' => false,
        ]);

        return back()->with('message', 'Message sent!');
    }

    private function threadsForAdmin(User $admin): Collection
    {
        $tutorIds = $this->tutorIds();

        if ($tutorIds->isEmpty()) {
            return collect();
        }

        $threads = TutorMessage::query()
            ->select('tutor_id')
            ->selectRaw('MAX(sent_at) as latest_message_at')
            ->selectRaw(
                'SUM(CASE WHEN is_read = false AND sender_id != ? THEN 1 ELSE 0 END) as unread_count',
                [$admin->id]
            )
            ->where('user_id', $admin->id)
            ->whereIn('tutor_id', $tutorIds)
            ->groupBy('tutor_id')
            ->orderByDesc('latest_message_at')
            ->get();

        $tutors = User::whereIn('id', $threads->pluck('tutor_id'))
            ->get()
            ->keyBy('id');

        return $threads->map(function ($thread) use ($admin, $tutors) {
            $tutor = $tutors->get($thread->tutor_id);

            return [
                'id' => "{$admin->id}-{$thread->tutor_id}",
                'admin' => $this->userSummary($admin),
                'tutor' => $this->userSummary($tutor),
                'latest_message_at' => $thread->latest_message_at,
                'unread_count' => (int) $thread->unread_count,
            ];
        })->filter(fn ($thread) => $thread['tutor']['id'])->values();
    }

    private function threadsForTutor(User $tutor): Collection
    {
        $adminIds = $this->adminIds();

        if ($adminIds->isEmpty()) {
            return collect();
        }

        $threads = TutorMessage::query()
            ->select('user_id')
            ->selectRaw('MAX(sent_at) as latest_message_at')
            ->selectRaw(
                'SUM(CASE WHEN is_read = false AND sender_id != ? THEN 1 ELSE 0 END) as unread_count',
                [$tutor->id]
            )
            ->where('tutor_id', $tutor->id)
            ->whereIn('user_id', $adminIds)
            ->groupBy('user_id')
            ->orderByDesc('latest_message_at')
            ->get();

        $admins = User::whereIn('id', $threads->pluck('user_id'))
            ->get()
            ->keyBy('id');

        return $threads->map(function ($thread) use ($tutor, $admins) {
            $admin = $admins->get($thread->user_id);

            return [
                'id' => "{$thread->user_id}-{$tutor->id}",
                'admin' => $this->userSummary($admin),
                'tutor' => $this->userSummary($tutor),
                'latest_message_at' => $thread->latest_message_at,
                'unread_count' => (int) $thread->unread_count,
            ];
        })->filter(fn ($thread) => $thread['admin']['id'])->values();
    }

    private function activeThreadForAdmin(User $admin, int $tutorId): ?array
    {
        $tutor = User::find($tutorId);

        if (! $tutor || ! $this->isTutorUser($tutor)) {
            return null;
        }

        $messages = TutorMessage::query()
            ->where('user_id', $admin->id)
            ->where('tutor_id', $tutorId)
            ->orderBy('sent_at')
            ->orderBy('id')
            ->paginate(50);

        TutorMessage::where('user_id', $admin->id)
            ->where('tutor_id', $tutorId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return [
            'admin' => $this->userSummary($admin),
            'tutor' => $this->userSummary($tutor),
            'messages' => $messages,
        ];
    }

    private function activeThreadForTutor(User $tutor, int $adminId): ?array
    {
        $admin = User::find($adminId);

        if (! $admin || ! $admin->hasRole('admin')) {
            return null;
        }

        $messages = TutorMessage::query()
            ->where('tutor_id', $tutor->id)
            ->where('user_id', $adminId)
            ->orderBy('sent_at')
            ->orderBy('id')
            ->paginate(50);

        TutorMessage::where('tutor_id', $tutor->id)
            ->where('user_id', $adminId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return [
            'admin' => $this->userSummary($admin),
            'tutor' => $this->userSummary($tutor),
            'messages' => $messages,
        ];
    }

    private function tutorsForAdmin(): Collection
    {
        $tutorIds = $this->tutorIds();

        if ($tutorIds->isEmpty()) {
            return collect();
        }

        return User::whereIn('id', $tutorIds)
            ->orderBy('name')
            ->get()
            ->map(fn (User $tutor) => $this->userSummary($tutor))
            ->values();
    }

    private function adminIds(): Collection
    {
        return User::role('admin')->pluck('id');
    }

    private function tutorIds(): Collection
    {
        $roleTutorIds = User::role('tutor')->pluck('id');
        $instructorIds = Course::query()
            ->whereNotNull('instructor_id')
            ->pluck('instructor_id');
        $adminIds = $this->adminIds();

        return $roleTutorIds->merge($instructorIds)
            ->unique()
            ->reject(fn (int $id) => $adminIds->contains($id))
            ->values();
    }

    private function userSummary(?User $user): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'avatar' => $user?->avatar,
        ];
    }

    private function isTutorUser(User $user): bool
    {
        if ($user->hasRole('tutor')) {
            return true;
        }

        return Course::where('instructor_id', $user->id)->exists();
    }
}
