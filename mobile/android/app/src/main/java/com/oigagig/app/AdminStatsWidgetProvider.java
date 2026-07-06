package com.oigagig.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AdminStatsWidgetProvider extends AppWidgetProvider {

    public static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, AdminStatsWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        if (ids.length == 0) return;

        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_admin_stats);
        JSONObject payload = AdminWidgetStorage.load(context);
        NumberFormat nf = NumberFormat.getIntegerInstance(new Locale("es", "CO"));

        if (payload != null) {
            views.setTextViewText(R.id.widget_online, nf.format(payload.optInt("onlineUsers", 0)));
            views.setTextViewText(R.id.widget_users, nf.format(payload.optInt("users", 0)));
            views.setTextViewText(R.id.widget_orders, nf.format(payload.optInt("orders", 0)));
            views.setTextViewText(
                R.id.widget_revenue,
                formatRevenue(Math.round(payload.optDouble("totalRevenue", 0d)))
            );

            String updatedAt = payload.optString("updatedAt", "");
            String updatedLabel = "Abre la app para actualizar";
            if (!updatedAt.isEmpty()) {
                try {
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
                    Date parsed = iso.parse(updatedAt.substring(0, Math.min(updatedAt.length(), 19)));
                    if (parsed != null) {
                        SimpleDateFormat display = new SimpleDateFormat("HH:mm", new Locale("es", "CO"));
                        updatedLabel = "Actualizado " + display.format(parsed);
                    }
                } catch (Exception ignored) {
                    updatedLabel = "Actualizado recientemente";
                }
            }
            views.setTextViewText(R.id.widget_updated, updatedLabel);
        } else {
            views.setTextViewText(R.id.widget_online, "—");
            views.setTextViewText(R.id.widget_users, "—");
            views.setTextViewText(R.id.widget_orders, "—");
            views.setTextViewText(R.id.widget_revenue, "—");
            views.setTextViewText(R.id.widget_updated, "Abre OigaGIG Admin para sincronizar");
        }

        Intent launch = new Intent(Intent.ACTION_VIEW, Uri.parse("https://oigagig.com/admin"));
        launch.setPackage(context.getPackageName());
        PendingIntent pending = PendingIntent.getActivity(
            context,
            0,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(widgetId, views);
    }

    private static String formatRevenue(long value) {
        if (value >= 1_000_000) {
            return "$" + String.format(Locale.US, "%.1fM", value / 1_000_000.0);
        }
        if (value >= 1_000) {
            return "$" + (value / 1_000) + "k";
        }
        return "$" + NumberFormat.getIntegerInstance(new Locale("es", "CO")).format(value);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, manager, id);
        }
    }

    @Override
    public void onEnabled(Context context) {
        updateAllWidgets(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(
        Context context,
        AppWidgetManager manager,
        int appWidgetId,
        android.os.Bundle newOptions
    ) {
        updateWidget(context, manager, appWidgetId);
    }
}