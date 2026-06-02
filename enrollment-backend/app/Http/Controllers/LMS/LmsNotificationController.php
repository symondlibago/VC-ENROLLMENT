<?php

namespace App\Http\Controllers\LMS;

use App\Http\Controllers\Controller;
use App\Models\LMS\LmsNotification;
use Illuminate\Http\Request;

class LmsNotificationController extends Controller
{
    /**
     * GET /me/notifications?limit=20&unread=1
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $limit = max(1, min(100, (int) $request->query('limit', 30)));
        $onlyUnread = $request->boolean('unread', false);

        $q = LmsNotification::where('user_id', $userId)->orderByDesc('created_at');
        if ($onlyUnread) {
            $q->whereNull('read_at');
        }

        $items = $q->limit($limit)->get();
        $unreadCount = LmsNotification::where('user_id', $userId)->whereNull('read_at')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function unreadCount(Request $request)
    {
        $count = LmsNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['success' => true, 'data' => ['unread_count' => $count]]);
    }

    public function markRead(Request $request, int $id)
    {
        $n = LmsNotification::where('user_id', $request->user()->id)->findOrFail($id);
        if (is_null($n->read_at)) {
            $n->read_at = now();
            $n->save();
        }
        return response()->json(['success' => true, 'data' => $n]);
    }

    public function markAllRead(Request $request)
    {
        LmsNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function destroy(Request $request, int $id)
    {
        $n = LmsNotification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->delete();
        return response()->json(['success' => true, 'message' => 'Notification removed.']);
    }
}
