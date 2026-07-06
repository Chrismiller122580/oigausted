package com.oigagig.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

@CapacitorPlugin(name = "AdminWidget")
public class AdminWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateStats(PluginCall call) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("onlineUsers", call.getInt("onlineUsers", 0));
            payload.put("users", call.getInt("users", 0));
            payload.put("orders", call.getInt("orders", 0));
            payload.put("completedOrders", call.getInt("completedOrders", 0));
            payload.put("totalRevenue", Math.round(call.getDouble("totalRevenue", 0d)));
            payload.put("updatedAt", call.getString("updatedAt", ""));

            AdminWidgetStorage.save(getContext(), payload);
            AdminStatsWidgetProvider.updateAllWidgets(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget stats", e);
        }
    }
}