package com.oigagig.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

@CapacitorPlugin(name = "AdminWidget")
public class AdminWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateStats(PluginCall call) {
        JSObject data = call.getData();
        if (data == null) {
            call.reject("Missing stats payload");
            return;
        }

        try {
            JSONObject payload = new JSONObject(data.toString());
            AdminWidgetStorage.save(getContext(), payload);
            AdminStatsWidgetProvider.updateAllWidgets(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget stats", e);
        }
    }
}