from django.contrib.auth import get_user_model
from django.test import TestCase


class BeverageEndpointTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="secret123")
        self.client.force_login(self.user)

    def test_remembered_device_restores_and_revokes_authentication(self):
        self.client.logout()

        login_response = self.client.post(
            "/api-token-auth/",
            {"username": "tester", "password": "secret123"},
            HTTP_X_DEVICE_FINGERPRINT="test-device-fingerprint",
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertIn("remembered_device", login_response.cookies)
        self.client.cookies.pop("remembered_device")

        restore_response = self.client.get(
            "/device-auth/",
            HTTP_X_DEVICE_FINGERPRINT="test-device-fingerprint",
        )
        self.assertEqual(restore_response.status_code, 200)
        self.assertEqual(restore_response.json()["token"], login_response.json()["token"])

        logout_response = self.client.post(
            "/device-logout/",
            HTTP_X_DEVICE_FINGERPRINT="test-device-fingerprint",
        )
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(
            self.client.get(
                "/device-auth/",
                HTTP_X_DEVICE_FINGERPRINT="test-device-fingerprint",
            ).status_code,
            401,
        )

    def test_fingerprint_collision_removes_fallback_mapping(self):
        fingerprint = "shared-device-fingerprint"
        login_response = self.client.post(
            "/api-token-auth/",
            {"username": "tester", "password": "secret123"},
            HTTP_X_DEVICE_FINGERPRINT=fingerprint,
        )
        self.assertEqual(login_response.status_code, 200)

        other_user = get_user_model().objects.create_user(
            username="other-tester",
            password="secret123",
        )
        other_client = self.client_class()
        other_login_response = other_client.post(
            "/api-token-auth/",
            {"username": other_user.username, "password": "secret123"},
            HTTP_X_DEVICE_FINGERPRINT=fingerprint,
        )
        self.assertEqual(other_login_response.status_code, 200)

        self.client.cookies.pop("remembered_device")
        self.assertEqual(
            self.client.get(
                "/device-auth/",
                HTTP_X_DEVICE_FINGERPRINT=fingerprint,
            ).status_code,
            401,
        )

    def test_rate_wine_endpoint_creates_rating(self):
        response = self.client.post(
            "/rate_wine/",
            {
                "name": "Merlot",
                "winery": "Hillcrest",
                "type": "Red",
                "style": "Dry",
                "taste": 80,
                "value": 15,
                "sessionability": 8,
                "packaging": 4,
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("saved successfully", response.json()["detail"])

    def test_rate_cider_endpoint_creates_rating(self):
        response = self.client.post(
            "/rate_cider/",
            {
                "name": "Crisp",
                "brewery": "Orchard Lane",
                "type": "Dry",
                "style": "Cider",
                "taste": 78,
                "value": 16,
                "texture": 7,
                "packaging": 4,
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("saved successfully", response.json()["detail"])
