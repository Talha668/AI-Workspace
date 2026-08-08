import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model


User = get_user_model()

@pytest.mark.django_db
class TestWorkspaceAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
    def test_create_workspace(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/workspaces/', {
            'name': 'API Workspace',
            'description': 'Created via API'
        })
        
        assert response.status_code == 201
        assert response.data['name'] == 'API Workspace'
        
    def test_list_workspaces(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/workspaces/')
        
        assert response.status_code == 200