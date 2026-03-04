from django.urls import path

from . import views

urlpatterns = [
    path("", views.ContactListView.as_view(), name="contact-list"),
    path("search/", views.UserSearchView.as_view(), name="user-search"),
    path("requests/", views.FriendRequestCreateView.as_view(), name="friend-request-create"),
    path("requests/incoming/", views.IncomingRequestsView.as_view(), name="requests-incoming"),
    path("requests/outgoing/", views.OutgoingRequestsView.as_view(), name="requests-outgoing"),
    path(
        "requests/<int:pk>/accept/",
        views.FriendRequestActionView.as_view(),
        {"action": "accept"},
        name="request-accept",
    ),
    path(
        "requests/<int:pk>/reject/",
        views.FriendRequestActionView.as_view(),
        {"action": "reject"},
        name="request-reject",
    ),
    path("<int:pk>/", views.ContactDetailView.as_view(), name="contact-detail"),
]
