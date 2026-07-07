package com.oigagig.app;

import android.content.Context;

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
        if (getActivity() == null) {
            call.reject("Activity not available");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Context ctx = getActivity().getApplicationContext();
                JSONObject payload = buildPayload(call);

                if (!AdminWidgetStorage.save(ctx, payload)) {
                    call.reject("Failed to persist widget stats");
                    return;
                }

                AdminStatsWidgetProvider.updateAllWidgets(ctx);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to update widget stats", e);
            }
        });
    }

    private JSONObject buildPayload(PluginCall call) throws Exception {
        JSObject data = call.getData();
        if (data != null && data.length() > 0) {
            return new JSONObject(data.toString());
        }

        JSONObject payload = new JSONObject();
        payload.put("onlineUsers", call.getInt("onlineUsers", 0));
        payload.put("users", call.getInt("users", 0));
        payload.put("orders", call.getInt("orders", 0));
        payload.put("completedOrders", call.getInt("completedOrders", 0));
        payload.put("totalRevenue", Math.round(call.getDouble("totalRevenue", 0d)));
        payload.put("updatedAt", call.getString("updatedAt", ""));
        return payload;
    }
}