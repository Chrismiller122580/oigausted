package com.oigagig.app;

import android.os.Bundle;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdminWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        applySystemBarLayout();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarLayout();
        // Refresh home-screen widget from cached stats when app returns to foreground.
        AdminStatsWidgetProvider.updateAllWidgets(this);
    }

    /**
     * Android 15+ defaults to edge-to-edge; keep system bars from covering the WebView
     * so the marketing homepage header stays aligned across OEM skins.
     */
    private void applySystemBarLayout() {
        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        } catch (Exception ignored) {
            // Older support libs / emulators — Capacitor StatusBar plugin still applies.
        }
    }
}
