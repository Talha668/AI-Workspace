from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'workspaces', views.WorkspaceViewSet, basename='workspace')
router.register(r'documents/', views.DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),

    # Connects frontend nested URL to the DocumentViewSet
    path('workspaces/<int:workspace_id>/documents/<int:pk>/download/',
        views.DocumentViewSet.as_view({'get': 'download'}),
        name='document-download-nested'),
]