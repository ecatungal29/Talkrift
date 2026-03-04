from django.urls import path

from . import views

urlpatterns = [
    path("", views.CallSessionListView.as_view(), name="call-list"),
    path("<int:pk>/", views.CallSessionDetailView.as_view(), name="call-detail"),
]
