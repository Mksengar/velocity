# ==========================================
# Velocity BI - Dashboard Service
# File: backend/services/dashboard_service.py
# ==========================================

from datetime import datetime
from uuid import uuid4
import json


# ==========================================
# In-Memory Dashboard Storage
# ==========================================
# Replace this with your MySQL/SQLAlchemy
# model later.

dashboards_db = {}


# ==========================================
# Utility Functions
# ==========================================

def generate_id():
    """
    Generate a unique ID.
    """
    return str(uuid4())


def current_timestamp():
    """
    Return current UTC timestamp.
    """
    return datetime.utcnow().isoformat()


def validate_required(data, fields):
    """
    Validate required fields.
    """

    missing = [
        field
        for field in fields
        if not data.get(field)
    ]

    if missing:
        raise ValueError(
            f"Required fields missing: {', '.join(missing)}"
        )


# ==========================================
# Dashboard Creation
# ==========================================

def create_dashboard(
    user_id,
    name,
    description="",
    layout="grid"
):
    """
    Create a new dashboard.
    """

    if not user_id:
        raise ValueError(
            "user_id is required."
        )

    if not name:
        raise ValueError(
            "Dashboard name is required."
        )

    dashboard_id = generate_id()

    dashboard = {
        "id": dashboard_id,
        "user_id": user_id,
        "name": name,
        "description": description,
        "layout": layout,
        "widgets": [],
        "settings": {
            "theme": "dark",
            "auto_refresh": False,
            "refresh_interval": 300
        },
        "is_public": False,
        "created_at": current_timestamp(),
        "updated_at": current_timestamp()
    }

    dashboards_db[dashboard_id] = dashboard

    return dashboard


# ==========================================
# Get Dashboard
# ==========================================

def get_dashboard(
    dashboard_id,
    user_id=None
):
    """
    Get a dashboard by ID.
    """

    dashboard = dashboards_db.get(
        dashboard_id
    )

    if not dashboard:
        raise ValueError(
            "Dashboard not found."
        )

    if (
        user_id is not None
        and dashboard["user_id"] != user_id
    ):
        raise PermissionError(
            "You do not have access to this dashboard."
        )

    return dashboard


# ==========================================
# Get User Dashboards
# ==========================================

def get_user_dashboards(user_id):
    """
    Return all dashboards belonging to a user.
    """

    if not user_id:
        raise ValueError(
            "user_id is required."
        )

    dashboards = [
        dashboard
        for dashboard in dashboards_db.values()
        if dashboard["user_id"] == user_id
    ]

    dashboards.sort(
        key=lambda item: item["updated_at"],
        reverse=True
    )

    return dashboards


# ==========================================
# Update Dashboard
# ==========================================

def update_dashboard(
    dashboard_id,
    user_id,
    name=None,
    description=None,
    layout=None,
    settings=None,
    is_public=None
):
    """
    Update dashboard information.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    if name is not None:
        dashboard["name"] = name

    if description is not None:
        dashboard["description"] = description

    if layout is not None:
        dashboard["layout"] = layout

    if settings is not None:

        if not isinstance(settings, dict):
            raise ValueError(
                "settings must be an object."
            )

        dashboard["settings"].update(
            settings
        )

    if is_public is not None:
        dashboard["is_public"] = bool(
            is_public
        )

    dashboard["updated_at"] = (
        current_timestamp()
    )

    dashboards_db[dashboard_id] = dashboard

    return dashboard


# ==========================================
# Delete Dashboard
# ==========================================

def delete_dashboard(
    dashboard_id,
    user_id
):
    """
    Delete a dashboard.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    del dashboards_db[dashboard_id]

    return {
        "success": True,
        "dashboard_id": dashboard["id"],
        "message": "Dashboard deleted successfully."
    }


# ==========================================
# Add Widget
# ==========================================

def add_widget(
    dashboard_id,
    user_id,
    widget_type,
    title,
    config=None,
    position=None
):
    """
    Add a visualization/widget to dashboard.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    if not widget_type:
        raise ValueError(
            "widget_type is required."
        )

    if not title:
        raise ValueError(
            "Widget title is required."
        )

    allowed_types = {
        "bar",
        "line",
        "pie",
        "scatter",
        "area",
        "table",
        "kpi",
        "metric",
        "heatmap",
        "histogram",
        "text"
    }

    if widget_type not in allowed_types:
        raise ValueError(
            f"Unsupported widget type: {widget_type}"
        )

    widget_id = generate_id()

    if position is None:
        position = {
            "x": 0,
            "y": len(
                dashboard["widgets"]
            ),
            "width": 6,
            "height": 4
        }

    widget = {
        "id": widget_id,
        "type": widget_type,
        "title": title,
        "config": config or {},
        "position": position,
        "created_at": current_timestamp(),
        "updated_at": current_timestamp()
    }

    dashboard["widgets"].append(
        widget
    )

    dashboard["updated_at"] = (
        current_timestamp()
    )

    return widget


# ==========================================
# Get Widget
# ==========================================

def get_widget(
    dashboard_id,
    widget_id,
    user_id
):
    """
    Find a widget inside a dashboard.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    for widget in dashboard["widgets"]:

        if widget["id"] == widget_id:
            return widget

    raise ValueError(
        "Widget not found."
    )


# ==========================================
# Update Widget
# ==========================================

def update_widget(
    dashboard_id,
    widget_id,
    user_id,
    title=None,
    config=None,
    position=None
):
    """
    Update an existing widget.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    widget = get_widget(
        dashboard_id,
        widget_id,
        user_id
    )

    if title is not None:
        widget["title"] = title

    if config is not None:

        if not isinstance(config, dict):
            raise ValueError(
                "config must be an object."
            )

        widget["config"].update(
            config
        )

    if position is not None:

        if not isinstance(position, dict):
            raise ValueError(
                "position must be an object."
            )

        widget["position"] = position

    widget["updated_at"] = (
        current_timestamp()
    )

    dashboard["updated_at"] = (
        current_timestamp()
    )

    return widget


# ==========================================
# Remove Widget
# ==========================================

def remove_widget(
    dashboard_id,
    widget_id,
    user_id
):
    """
    Remove a widget from a dashboard.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    original_count = len(
        dashboard["widgets"]
    )

    dashboard["widgets"] = [
        widget
        for widget in dashboard["widgets"]
        if widget["id"] != widget_id
    ]

    if len(dashboard["widgets"]) == original_count:
        raise ValueError(
            "Widget not found."
        )

    dashboard["updated_at"] = (
        current_timestamp()
    )

    return {
        "success": True,
        "message": "Widget removed successfully.",
        "dashboard_id": dashboard_id,
        "widget_id": widget_id
    }


# ==========================================
# Duplicate Widget
# ==========================================

def duplicate_widget(
    dashboard_id,
    widget_id,
    user_id
):
    """
    Duplicate an existing widget.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    original = get_widget(
        dashboard_id,
        widget_id,
        user_id
    )

    new_widget = {
        "id": generate_id(),
        "type": original["type"],
        "title": f"{original['title']} Copy",
        "config": json.loads(
            json.dumps(
                original["config"]
            )
        ),
        "position": {
            **original["position"],
            "y": (
                original["position"].get(
                    "y",
                    0
                ) + original["position"].get(
                    "height",
                    4
                )
            )
        },
        "created_at": current_timestamp(),
        "updated_at": current_timestamp()
    }

    dashboard["widgets"].append(
        new_widget
    )

    dashboard["updated_at"] = (
        current_timestamp()
    )

    return new_widget


# ==========================================
# Update Widget Positions
# ==========================================

def update_widget_positions(
    dashboard_id,
    user_id,
    positions
):
    """
    Update positions of multiple widgets.

    positions example:

    [
        {
            "widget_id": "abc",
            "x": 0,
            "y": 0,
            "width": 6,
            "height": 4
        }
    ]
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    if not isinstance(
        positions,
        list
    ):
        raise ValueError(
            "positions must be a list."
        )

    updated = 0

    for item in positions:

        widget_id = item.get(
            "widget_id"
        )

        if not widget_id:
            continue

        for widget in dashboard["widgets"]:

            if widget["id"] == widget_id:

                widget["position"] = {
                    "x": item.get(
                        "x",
                        0
                    ),
                    "y": item.get(
                        "y",
                        0
                    ),
                    "width": item.get(
                        "width",
                        6
                    ),
                    "height": item.get(
                        "height",
                        4
                    )
                }

                widget["updated_at"] = (
                    current_timestamp()
                )

                updated += 1

    dashboard["updated_at"] = (
        current_timestamp()
    )

    return {
        "success": True,
        "updated_widgets": updated
    }


# ==========================================
# Dashboard Statistics
# ==========================================

def get_dashboard_statistics(
    dashboard_id,
    user_id
):
    """
    Return dashboard statistics.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    widgets = dashboard["widgets"]

    widget_types = {}

    for widget in widgets:

        widget_type = widget["type"]

        widget_types[widget_type] = (
            widget_types.get(
                widget_type,
                0
            ) + 1
        )

    return {
        "dashboard_id": dashboard["id"],
        "name": dashboard["name"],
        "widget_count": len(widgets),
        "widget_types": widget_types,
        "is_public": dashboard["is_public"],
        "created_at": dashboard["created_at"],
        "updated_at": dashboard["updated_at"]
    }


# ==========================================
# Duplicate Dashboard
# ==========================================

def duplicate_dashboard(
    dashboard_id,
    user_id,
    new_name=None
):
    """
    Create a copy of an existing dashboard.
    """

    original = get_dashboard(
        dashboard_id,
        user_id
    )

    new_dashboard_id = generate_id()

    new_dashboard = json.loads(
        json.dumps(original)
    )

    new_dashboard["id"] = (
        new_dashboard_id
    )

    new_dashboard["name"] = (
        new_name
        or f"{original['name']} Copy"
    )

    new_dashboard["created_at"] = (
        current_timestamp()
    )

    new_dashboard["updated_at"] = (
        current_timestamp()
    )

    # Generate new widget IDs
    for widget in new_dashboard["widgets"]:

        widget["id"] = generate_id()

        widget["created_at"] = (
            current_timestamp()
        )

        widget["updated_at"] = (
            current_timestamp()
        )

    dashboards_db[
        new_dashboard_id
    ] = new_dashboard

    return new_dashboard


# ==========================================
# Public Dashboard
# ==========================================

def get_public_dashboard(
    dashboard_id
):
    """
    Return dashboard if it is public.
    """

    dashboard = dashboards_db.get(
        dashboard_id
    )

    if not dashboard:
        raise ValueError(
            "Dashboard not found."
        )

    if not dashboard["is_public"]:
        raise PermissionError(
            "This dashboard is private."
        )

    return dashboard


# ==========================================
# Export Dashboard Configuration
# ==========================================

def export_dashboard(
    dashboard_id,
    user_id
):
    """
    Export dashboard as JSON-compatible
    dictionary.
    """

    dashboard = get_dashboard(
        dashboard_id,
        user_id
    )

    return {
        "export_version": "1.0",
        "exported_at": current_timestamp(),
        "dashboard": dashboard
    }


# ==========================================
# Import Dashboard
# ==========================================

def import_dashboard(
    user_id,
    dashboard_data
):
    """
    Import a dashboard configuration.
    """

    if not dashboard_data:
        raise ValueError(
            "Dashboard data is required."
        )

    original = dashboard_data.get(
        "dashboard",
        dashboard_data
    )

    if not original.get("name"):
        raise ValueError(
            "Dashboard name is required."
        )

    dashboard_id = generate_id()

    dashboard = {
        "id": dashboard_id,
        "user_id": user_id,
        "name": original["name"],
        "description": original.get(
            "description",
            ""
        ),
        "layout": original.get(
            "layout",
            "grid"
        ),
        "widgets": [],
        "settings": original.get(
            "settings",
            {}
        ),
        "is_public": False,
        "created_at": current_timestamp(),
        "updated_at": current_timestamp()
    }

    for widget in original.get(
        "widgets",
        []
    ):

        imported_widget = {
            "id": generate_id(),
            "type": widget.get(
                "type",
                "text"
            ),
            "title": widget.get(
                "title",
                "Untitled"
            ),
            "config": widget.get(
                "config",
                {}
            ),
            "position": widget.get(
                "position",
                {
                    "x": 0,
                    "y": 0,
                    "width": 6,
                    "height": 4
                }
            ),
            "created_at": current_timestamp(),
            "updated_at": current_timestamp()
        }

        dashboard["widgets"].append(
            imported_widget
        )

    dashboards_db[
        dashboard_id
    ] = dashboard

    return dashboard