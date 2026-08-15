from django.contrib.auth import get_user_model
from django.test import TestCase


class BeverageEndpointTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="secret123")

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
