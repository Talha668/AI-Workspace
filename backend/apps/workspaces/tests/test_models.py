import pytest
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, Document


User = get_user_model

@pytest.mark.django_db
class TestWorkspace:
    def test_create_workspace(self):
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        workspace = Workspace.objects.create(
            name='Test Workspace',
            description='Test Description',
            owner=user
        )

        assert workspace.name == 'Test Workspace'
        assert workspace.owner == user
        assert workspace.documents.count() == 0

    def test_workspace_str(self):
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )   

        workspace = Workspace.objects.create(
            name='Test Workspace',
            owner=user
        )

        assert str(workspce) == f'Test Worksapce - {user.email}'