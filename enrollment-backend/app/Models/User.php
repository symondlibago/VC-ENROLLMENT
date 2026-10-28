<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'secondary_pin',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'secondary_pin',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function instructor()
    {
        return $this->hasOne(Instructor::class);
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['has_pin'];

    /**
     * Determine if the user has a secondary PIN.
     *
     * @return \Illuminate\Database\Eloquent\Casts\Attribute
     */
    protected function hasPin(): Attribute
    {
        return new Attribute(
            get: fn () => !is_null($this->secondary_pin),
        );
    }

    /**
     * Get the student profile associated with the user.
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(PreEnrolledStudent::class);
    }

    /**
     * The clearance lines this user may sign.
     *
     * Held apart from `role` on purpose: a signatory may be an instructor, a
     * member of admin staff or neither, and one person can hold two lines —
     * the registrar is also the guidance counsellor.
     */
    public function clearanceRoles(): BelongsToMany
    {
        return $this->belongsToMany(ClearanceRole::class, 'clearance_role_user')
            ->withPivot('assigned_by')
            ->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'Admin';
    }

    /** Whether the clearance board should appear for this user at all. */
    public function canAccessClearance(): bool
    {
        return $this->isAdmin() || $this->clearanceRoles()->exists();
    }
}
