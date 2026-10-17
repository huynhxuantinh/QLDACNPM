from rest_framework import generics, serializers, status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import IsProjectManagerOrAdmin, IsSystemAdmin
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    UserManageSerializer,
    UserOptionSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError as exc:
            raise serializers.ValidationError({"refresh": str(exc)}) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Đổi mật khẩu thành công."})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManageSerializer
    permission_classes = [IsSystemAdmin]
    http_method_names = ["get", "post", "patch", "head", "options"]
    filter_backends = [SearchFilter]
    search_fields = ["email", "full_name"]

    def get_permissions(self):
        permission_classes = (
            [IsProjectManagerOrAdmin]
            if self.action == "list"
            else [IsSystemAdmin]
        )
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        if (
            self.action == "list"
            and getattr(self.request.user, "role", None) == User.Role.PROJECT_MANAGER
        ):
            return queryset.filter(is_active=True)
        return queryset

    def get_serializer_class(self):
        if (
            self.action == "list"
            and getattr(self.request.user, "role", None) == User.Role.PROJECT_MANAGER
        ):
            return UserOptionSerializer
        return super().get_serializer_class()
