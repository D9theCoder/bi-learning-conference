<?php

namespace App\Http\Middleware;

use App\Models\Course;
use App\Models\TutorMessage;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
                'roles' => $user ? $user->getRoleNames() : [],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
                'adminTutorChatAvailable' => $this->adminTutorChatAvailable($user),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function adminTutorChatAvailable(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if (! $this->isTutorUser($user)) {
            return false;
        }

        $adminIds = User::role('admin')->pluck('id');

        if ($adminIds->isEmpty()) {
            return false;
        }

        return TutorMessage::query()
            ->where('tutor_id', $user->id)
            ->whereIn('user_id', $adminIds)
            ->exists();
    }

    private function isTutorUser(User $user): bool
    {
        if ($user->hasRole('tutor')) {
            return true;
        }

        return Course::where('instructor_id', $user->id)->exists();
    }
}
