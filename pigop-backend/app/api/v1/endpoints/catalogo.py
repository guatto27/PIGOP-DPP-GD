"""
Catálogo de UPPs y Funcionarios — endpoints para texto predictivo.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/catalogo", tags=["Catálogo"])


class FuncionarioItem(BaseModel):
    id: int
    codigo_upp: str
    nombre_upp: str
    codigo_ur: Optional[str] = None
    nombre_ur: Optional[str] = None
    nombre_titular: Optional[str] = None
    cargo: Optional[str] = None


class UPPItem(BaseModel):
    codigo_upp: str
    nombre_upp: str


@router.get("/upps", response_model=List[UPPItem], summary="Listar UPPs únicas")
async def listar_upps(
    q: str = Query("", description="Filtro por código o nombre"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_active_user),
):
    """Retorna lista de UPPs únicas para autocompletado."""
    if q:
        result = await db.execute(text(
            "SELECT DISTINCT codigo_upp, nombre_upp FROM catalogo_funcionarios "
            "WHERE (codigo_upp LIKE :q OR LOWER(nombre_upp) LIKE :q2) AND estatus='VIGENTE' "
            "ORDER BY codigo_upp LIMIT 50"
        ), {"q": f"%{q}%", "q2": f"%{q.lower()}%"})
    else:
        result = await db.execute(text(
            "SELECT DISTINCT codigo_upp, nombre_upp FROM catalogo_funcionarios "
            "WHERE estatus='VIGENTE' ORDER BY codigo_upp"
        ))
    return [{"codigo_upp": r[0], "nombre_upp": r[1]} for r in result.fetchall()]


@router.get("/funcionarios", response_model=List[FuncionarioItem], summary="Buscar funcionarios")
async def buscar_funcionarios(
    q: str = Query("", description="Búsqueda por nombre, UPP o UR"),
    upp: str = Query("", description="Filtrar por código UPP"),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_active_user),
):
    """Busca funcionarios por nombre, dependencia o código UPP."""
    conditions = ["estatus='VIGENTE'"]
    params = {}

    if q:
        conditions.append(
            "(LOWER(nombre_titular) LIKE :q OR LOWER(nombre_upp) LIKE :q OR LOWER(nombre_ur) LIKE :q)"
        )
        params["q"] = f"%{q.lower()}%"

    if upp:
        conditions.append("codigo_upp = :upp")
        params["upp"] = upp

    where = " AND ".join(conditions)
    result = await db.execute(text(
        f"SELECT id, codigo_upp, nombre_upp, codigo_ur, nombre_ur, nombre_titular, cargo "
        f"FROM catalogo_funcionarios WHERE {where} ORDER BY nombre_upp, nombre_ur LIMIT 50"
    ), params)

    return [
        {
            "id": r[0], "codigo_upp": r[1], "nombre_upp": r[2],
            "codigo_ur": r[3], "nombre_ur": r[4],
            "nombre_titular": r[5], "cargo": r[6],
        }
        for r in result.fetchall()
    ]
