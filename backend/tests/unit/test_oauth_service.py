"""
Unit tests for OAuth service functionality (US2).

Tests cover:
- T093: OAuth callback handling
- T094: Account conflict detection
- T095: OAuth account linking
"""

from unittest.mock import Mock, patch
from uuid import uuid4

import pytest

from coinvault.services.auth_service import AuthService


class TestOAuthCallbackHandling:
    """T093 [P] [US2] Unit tests for OAuth callback handling"""

    async def test_google_oauth_callback_new_user(self):
        """Test OAuth callback creates new user when email doesn't exist"""
        auth_service = AuthService()

        # Mock Supabase OAuth callback
        mock_user = {
            "id": str(uuid4()),
            "email": "newuser@gmail.com",
            "app_metadata": {"provider": "google"},
            "user_metadata": {"full_name": "New User"},
        }

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.return_value = Mock(user=Mock(**mock_user))

            # Mock get_user_profile to return None (new user)
            with patch.object(auth_service, "get_user_profile") as mock_profile:
                mock_profile.return_value = None

                # Mock table insert
                with patch.object(auth_service.client, "table") as mock_table:
                    mock_table.return_value.insert.return_value.execute.return_value = Mock(
                        data=[
                            {
                                "id": mock_user["id"],
                                "email": mock_user["email"],
                                "role": "admin",
                                "linked_providers": ["google"],
                            }
                        ]
                    )

                    result = await auth_service.handle_oauth_callback("google", "mock-access-token")

                    assert result is not None
                    assert result["email"] == "newuser@gmail.com"

    async def test_google_oauth_callback_existing_user(self):
        """Test OAuth callback returns existing user"""
        auth_service = AuthService()

        mock_user = {
            "id": str(uuid4()),
            "email": "existing@gmail.com",
            "app_metadata": {"provider": "google"},
            "user_metadata": {},
        }

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.return_value = Mock(user=Mock(**mock_user))

            # Mock get_user_profile to return existing user
            existing_profile = {
                "id": mock_user["id"],
                "email": mock_user["email"],
                "role": "admin",
                "linked_providers": ["email"],
                "display_name": "Existing User",
            }
            with patch.object(auth_service, "get_user_profile") as mock_profile:
                mock_profile.return_value = existing_profile

                # Mock link_provider
                with patch.object(auth_service, "link_provider") as mock_link:
                    mock_link.return_value = {
                        **existing_profile,
                        "linked_providers": ["email", "google"],
                    }

                    result = await auth_service.handle_oauth_callback("google", "mock-access-token")

                    assert result is not None
                    assert result["email"] == "existing@gmail.com"

    async def test_oauth_callback_invalid_token(self):
        """Test OAuth callback fails with invalid token"""
        auth_service = AuthService()

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.side_effect = Exception("Invalid token")

            with pytest.raises(Exception, match="Invalid token"):
                await auth_service.handle_oauth_callback("google", "invalid-token")


class TestAccountConflictDetection:
    """T094 [P] [US2] Unit tests for account conflict detection"""

    async def test_detect_conflict_via_oauth_callback(self):
        """Test conflict detection when OAuth callback finds existing email with different provider"""
        auth_service = AuthService()

        mock_user_id = str(uuid4())
        mock_user = {
            "id": mock_user_id,
            "email": "user@example.com",
            "app_metadata": {"provider": "google"},
            "user_metadata": {},
        }

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.return_value = Mock(user=Mock(**mock_user))

            # Mock existing profile with email provider
            existing_profile = {
                "id": "different-id",  # Different user ID indicates conflict
                "email": "user@example.com",
                "linked_providers": ["email"],
                "display_name": "Existing User",
            }

            with patch.object(auth_service, "get_user_profile") as mock_profile:
                mock_profile.return_value = existing_profile

                with patch.object(auth_service, "link_provider") as mock_link:
                    mock_link.return_value = existing_profile

                    result = await auth_service.handle_oauth_callback("google", "mock-token")
                    assert result is not None

    async def test_no_conflict_new_user(self):
        """Test no conflict when email doesn't exist"""
        auth_service = AuthService()

        mock_user = {
            "id": str(uuid4()),
            "email": "newuser@example.com",
            "app_metadata": {"provider": "google"},
        }

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.return_value = Mock(user=Mock(**mock_user))

            with patch.object(auth_service, "get_user_profile") as mock_profile:
                mock_profile.return_value = None  # No existing user

                with patch.object(auth_service.client, "table") as mock_table:
                    mock_table.return_value.insert.return_value.execute.return_value = Mock(
                        data=[
                            {
                                "id": mock_user["id"],
                                "email": mock_user["email"],
                                "linked_providers": ["google"],
                            }
                        ]
                    )

                    result = await auth_service.handle_oauth_callback("google", "mock-token")
                    assert result is not None
                    assert result["email"] == "newuser@example.com"

    async def test_no_conflict_same_provider_already_linked(self):
        """Test no conflict when provider is already linked to same user"""
        auth_service = AuthService()

        mock_user_id = str(uuid4())
        mock_user = {
            "id": mock_user_id,
            "email": "user@example.com",
            "app_metadata": {"provider": "google"},
            "user_metadata": {},
        }

        with patch.object(auth_service.client.auth, "get_user") as mock_get_user:
            mock_get_user.return_value = Mock(user=Mock(**mock_user))

            # User already has google linked
            existing_profile = {
                "id": mock_user_id,
                "email": "user@example.com",
                "linked_providers": ["email", "google"],
                "display_name": "Test User",
            }

            with patch.object(auth_service, "get_user_profile") as mock_profile:
                mock_profile.return_value = existing_profile

                with patch.object(auth_service, "link_provider") as mock_link:
                    mock_link.return_value = existing_profile

                    result = await auth_service.handle_oauth_callback("google", "mock-token")
                    assert result is not None


class TestOAuthAccountLinking:
    """T095 [P] [US2] Unit tests for OAuth account linking"""

    async def test_link_google_account_success(self):
        """Test successful Google account linking"""
        auth_service = AuthService()
        user_id = str(uuid4())

        with patch.object(auth_service.client, "table") as mock_table:
            # Mock existing profile
            mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
                data={
                    "id": user_id,
                    "email": "user@example.com",
                    "linked_providers": ["email"],
                }
            )

            # Mock update
            mock_table.return_value.update.return_value.eq.return_value.execute.return_value = Mock(
                data=[
                    {
                        "id": user_id,
                        "linked_providers": ["email", "google"],
                    }
                ]
            )

            result = await auth_service.link_provider(user_id, "google")

            assert result is not None
            assert "google" in result["linked_providers"]

    async def test_link_account_already_linked(self):
        """Test linking returns profile when provider already linked"""
        auth_service = AuthService()
        user_id = str(uuid4())

        with patch.object(auth_service.client, "table") as mock_table:
            mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
                data={
                    "id": user_id,
                    "email": "user@example.com",
                    "linked_providers": ["email", "google"],
                }
            )

            # Should return existing profile when already linked
            result = await auth_service.link_provider(user_id, "google")
            assert result is not None
            assert "google" in result["linked_providers"]

    async def test_unlink_google_account_success(self):
        """Test successful Google account unlinking"""
        auth_service = AuthService()
        user_id = str(uuid4())

        with patch.object(auth_service.client, "table") as mock_table:
            # Mock existing profile with multiple providers
            mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
                data={
                    "id": user_id,
                    "email": "user@example.com",
                    "linked_providers": ["email", "google"],
                }
            )

            # Mock update
            mock_table.return_value.update.return_value.eq.return_value.execute.return_value = Mock(
                data=[
                    {
                        "id": user_id,
                        "linked_providers": ["email"],
                    }
                ]
            )

            result = await auth_service.unlink_provider(user_id, "google")

            assert result is not None
            assert "google" not in result["linked_providers"]

    async def test_unlink_last_provider_fails(self):
        """Test unlinking fails when it's the only provider"""
        auth_service = AuthService()
        user_id = str(uuid4())

        with patch.object(auth_service.client, "table") as mock_table:
            mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
                data={
                    "id": user_id,
                    "email": "user@example.com",
                    "linked_providers": ["google"],
                }
            )

            with pytest.raises(ValueError, match="last.*provider"):
                await auth_service.unlink_provider(user_id, "google")
