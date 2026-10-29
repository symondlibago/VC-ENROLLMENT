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

    /**
     * Whether this user may sign every outstanding line in one action.
     *
     * The admin's override, and the cashier's. The cashier signs last and
     * sits at the counter the student is standing at, so they are the one
     * who has to finish a clearance when the other signatories are not
     * around. Every line signed this way is marked as a stand-in signature,
     * so the record still says who really held it.
     *
     * Keyed on the account role rather than on holding the cashier's
     * signature line: the power is the job, and it should not quietly
     * disappear the day somebody reassigns that line.
     */
    public function canSignEveryLine(): bool
    {
        return $this->isAdmin() || $this->role === 'Cashier';
    }

    /** Whether the clearance board should appear for this user at all. */
    public function canAccessClearance(): bool
    {
        return $this->canSignEveryLine() || $this->clearanceRoles()->exists();
    }
}
