# Orquestación de Agentes

## Agentes Disponibles

Los agentes de Junior Dev se distribuyen con el plugin `junior-dev@junior-dev`, no en `~/.claude/agents/`.
Se invocan a través de la herramienta Agent con un `subagent_type` con ámbito de plugin:

```text
Agent(subagent_type: "junior-dev:planner", prompt: "...")
```

| Agente | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| junior-dev:planner | Planificación de implementación | Features complejas, refactoring |
| junior-dev:architect | Diseño de sistemas | Decisiones arquitectónicas |
| junior-dev:tdd-guide | Desarrollo guiado por pruebas | Nuevas features, corrección de bugs |
| junior-dev:code-reviewer | Revisión de código | Después de escribir código |
| junior-dev:security-reviewer | Análisis de seguridad | Antes de los commits |
| junior-dev:build-error-resolver | Corrección de errores de build | Cuando el build falla |
| junior-dev:e2e-runner | Testing E2E | Flujos de usuario críticos |
| junior-dev:refactor-cleaner | Limpieza de código muerto | Mantenimiento de código |
| junior-dev:doc-updater | Documentación | Actualización de docs |
| junior-dev:rust-reviewer | Revisión de código Rust | Proyectos Rust |
| junior-dev:harmonyos-app-resolver | Desarrollo de apps HarmonyOS | Proyectos HarmonyOS/ArkTS |

Para el roster completo de 68 agentes, ver `/junior-dev:junior-dev-guide`.

## Uso Inmediato de Agentes

Sin necesidad de prompt del usuario:
1. Solicitudes de features complejas - Usar el agente **junior-dev:planner**
2. Código recién escrito/modificado - Usar el agente **junior-dev:code-reviewer**
3. Corrección de bug o nueva feature - Usar el agente **junior-dev:tdd-guide**
4. Decisión arquitectónica - Usar el agente **junior-dev:architect**

## Ejecución Paralela de Tareas

SIEMPRE usar ejecución paralela de tareas para operaciones independientes:

```markdown
# CORRECTO: Ejecución paralela
Lanzar 3 agentes en paralelo:
1. Agente 1: Análisis de seguridad del módulo de auth
2. Agente 2: Revisión de rendimiento del sistema de caché
3. Agente 3: Verificación de tipos de las utilidades

# INCORRECTO: Secuencial cuando no es necesario
Primero agente 1, luego agente 2, luego agente 3
```

## Análisis Multi-Perspectiva

Para problemas complejos, usar sub-agentes con roles divididos:
- Revisor factual
- Ingeniero senior
- Experto en seguridad
- Revisor de consistencia
- Verificador de redundancias
