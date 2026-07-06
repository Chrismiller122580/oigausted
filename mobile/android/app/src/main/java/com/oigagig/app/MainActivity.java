package com.oigagig.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdminWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Refresh home-screen widget from cached stats when app returns to foreground.
        AdminStatsWidgetProvider.updateAllWidgets(this);
    }
}
