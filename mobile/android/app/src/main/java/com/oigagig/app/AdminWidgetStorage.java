package com.oigagig.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

public final class AdminWidgetStorage {
    private static final String PREFS = "oigagig_admin_widget";
    private static final String KEY_PAYLOAD = "payload";

    private AdminWidgetStorage() {}

    public static void save(Context context, JSONObject payload) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PAYLOAD, payload.toString()).apply();
    }

    public static JSONObject load(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_PAYLOAD, null);
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        try {
            return new JSONObject(raw);
        } catch (Exception ignored) {
            return null;
        }
    }
}