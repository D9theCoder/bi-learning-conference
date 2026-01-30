<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterUsersRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(FilterUsersRequest $request): Response
    {
        $filters = $request->validated();
        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_dir'] ?? 'desc';

        $users = User::query()
            ->with('roles')
            ->when(
                $request->user(),
                fn ($query, $authUser) => $query->where('id', '!=', $authUser->id)
            )
            ->when(
                ! empty($filters['role']),
                fn ($query) => $query->role($filters['role'])
            )
            ->when(
                ! empty($filters['search']),
                fn ($query) => $query->where(function ($query) use ($filters) {
                    $query->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('email', 'like', "%{$filters['search']}%");
                })
            )
            ->orderBy($sortField, $sortDirection)
            ->paginate(12)
            ->withQueryString()
            ->through(function (User $user) use ($request) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'created_at' => $user->created_at?->toIsoString(),
                    'roles' => $user->roles->map(fn ($role) => [
                        'id' => $role->id,
                        'name' => $role->name,
                    ]),
                    'can_delete' => $request->user()?->id !== $user->id,
                ];
            });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->getRoleNames()->first(),
            ],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->assignRole($data['role']);

        return redirect()
            ->route('admin.users.index')
            ->with('message', 'User created.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        $user->syncRoles([$data['role']]);

        return redirect()
            ->route('admin.users.index')
            ->with('message', 'User updated.');
    }

    public function destroy(User $user, Request $request): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('message', 'User deleted.');
    }
}
