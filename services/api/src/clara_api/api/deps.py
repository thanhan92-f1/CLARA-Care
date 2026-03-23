from fastapi import Depends

from clara_api.core.rbac import get_current_token


def current_user_token(token=Depends(get_current_token)):
    return token
