from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from clara_api.core.control_tower.defaults import CONTROL_TOWER_KEY, get_default_control_tower_config
from clara_api.db.models import SystemSetting
from clara_api.schemas import SystemControlTowerConfig


class ControlTowerConfigService:
    def __init__(
        self,
        *,
        setting_key: str = CONTROL_TOWER_KEY,
        default_factory: Callable[[], SystemControlTowerConfig] = get_default_control_tower_config,
    ) -> None:
        self._setting_key = setting_key
        self._default_factory = default_factory

    def load(self, db: Session) -> SystemControlTowerConfig:
        row = db.execute(
            select(SystemSetting).where(SystemSetting.key == self._setting_key)
        ).scalar_one_or_none()
        if not row or not isinstance(row.value_json, dict):
            return self._default_factory()
        try:
            return SystemControlTowerConfig.model_validate(row.value_json)
        except Exception:
            return self._default_factory()

    def save(self, db: Session, payload: SystemControlTowerConfig) -> SystemControlTowerConfig:
        row = db.execute(
            select(SystemSetting).where(SystemSetting.key == self._setting_key)
        ).scalar_one_or_none()
        if not row:
            row = SystemSetting(key=self._setting_key)
        row.value_json = payload.model_dump(mode="json")
        row.value_text = ""
        db.add(row)
        db.commit()
        db.refresh(row)
        return SystemControlTowerConfig.model_validate(row.value_json or {})


_CONTROL_TOWER_CONFIG_SERVICE = ControlTowerConfigService()


def get_control_tower_config_service() -> ControlTowerConfigService:
    return _CONTROL_TOWER_CONFIG_SERVICE
