# Laboratorio 02 - Docker Compose

Proyecto desarrollado para desplegar un entorno multicontenedor orquestado con **Docker Compose**, compuesto por una Minimal API (Node.js + Express) distribuida en tres réplicas locales independientes y una base de datos relacional **PostgreSQL** con persistencia de datos mediante volúmenes y aislamiento de red.

---

## 📋 Tabla de Contenidos
1. [Descripción del Proyecto](#-descripción-del-proyecto)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Variables de Entorno](#-variables-de-entorno)
5. [Guía de Comandos y Despliegue](#-guía-de-comandos-y-despliegue)
6. [Verificación de los Servicios](#-verificación-de-los-servicios)
7. [Explicación Teórica: Redes en Docker](#-explicación-teórica-redes-en-docker)
8. [Explicación Teórica: Volúmenes en Docker](#-explicación-teórica-volúmenes-en-docker)
9. [Capturas de Pantalla](#-capturas-de-pantalla)
10. [Créditos](#-créditos)

---

## 🚀 Descripción del Proyecto

El objetivo de este laboratorio es implementar una arquitectura distribuida localmente mediante **Docker Compose**:
- **3 réplicas de la API Web**: Construidas de forma local (uild: .), cada una ejecutándose en su propio contenedor y mapeando un puerto de host distinto (3000, 3001, 3002). Cada instancia responde con un mensaje en formato JSON que incluye el nombre del autor: **Valderrama Llajaruna Enrique**.
- **Base de Datos PostgreSQL**: Contenedor aislado conectado a la misma red virtual privada, configurado con credenciales seguras mediante variables de entorno y persistencia a través de un volumen administrado por Docker.
- **Red Aislada (pp_network)**: Red tipo *bridge* personalizada que proporciona resolución DNS automática entre contenedores por nombre de servicio (db, pi1, pi2, pi3).

---

## 🛠️ Stack Tecnológico

- **Lenguaje / Plataforma:** Node.js (v20 Alpine)
- **Framework Web:** Express.js (Minimal API)
- **Base de Datos:** PostgreSQL 15 Alpine
- **Contenedores y Orquestación:** Docker Engine & Docker Compose (v2)

---

## 📁 Estructura del Proyecto

`plaintext
LAB2-DOCKER-COMPOSE/
├── .env                  # Variables de entorno locales (ignorado en git)
├── .env.example          # Archivo de ejemplo con variables de configuración
├── .gitignore            # Archivos y directorios excluidos del repositorio
├── .dockerignore         # Archivos excluidos del contexto de compilación Docker
├── Dockerfile            # Instrucciones para la construcción local de la imagen de la API
├── docker-compose.yml    # Definición y orquestación de servicios, redes y volúmenes
├── package.json          # Metadatos del proyecto y dependencias (Express)
├── index.js              # Código fuente de la Minimal API
└── README.md             # Documentación exhaustiva del laboratorio
`

---

## ⚙️ Variables de Entorno

El proyecto hace uso de variables de entorno centralizadas en un archivo .env (el cual está excluido del control de versiones por seguridad). Se proporciona el archivo .env.example como plantilla de referencia:

`env
# ==========================================
# Variables de Entorno - Laboratorio 02
# ==========================================

# Base de datos PostgreSQL
POSTGRES_USER=Enrique
POSTGRES_PASSWORD=Enrique2026
POSTGRES_DB=lab02
DB_PORT=5432

# Puertos para las réplicas locales de la API
API1_PORT=3000
API2_PORT=3001
API3_PORT=3002
`

### Propósito de cada variable:
| Variable | Propósito | Valor por Defecto |
| :--- | :--- | :--- |
| POSTGRES_USER | Usuario administrador de la base de datos PostgreSQL | Enrique |
| POSTGRES_PASSWORD | Contraseña para el usuario de PostgreSQL | Enrique2026 |
| POSTGRES_DB | Nombre de la base de datos inicial | lab02 |
| DB_PORT | Puerto de host expuesto para la base de datos | 5432 |
| API1_PORT | Puerto en el host para la primera instancia de la API | 3000 |
| API2_PORT | Puerto en el host para la segunda instancia de la API | 3001 |
| API3_PORT | Puerto en el host para la tercera instancia de la API | 3002 |

---

## 💻 Guía de Comandos y Despliegue

### 1. Preparación del Entorno
Antes de levantar el proyecto, asegúrate de tener el archivo .env configurado:
`ash
# En Windows PowerShell:
Copy-Item .env.example .env

# En Linux/macOS:
cp .env.example .env
`

### 2. Construir las imágenes y levantar los contenedores
Para construir la imagen de la API localmente y levantar los 4 contenedores en segundo plano (*detached mode*):
`ash
docker compose up -d --build
`

### 3. Verificar el estado de los contenedores
`ash
docker compose ps
`

### 4. Consultar los registros (logs)
`ash
# Ver logs de todos los servicios en tiempo real:
docker compose logs -f

# Ver logs únicamente de la base de datos:
docker compose logs -f db

# Ver logs de una réplica de la API específica:
docker compose logs -f api1
`

### 5. Detener y remover los contenedores
`ash
# Detener los contenedores conservando los volúmenes (datos seguros):
docker compose down

# Detener los contenedores y eliminar también los volúmenes de datos:
docker compose down -v
`

---

## 🔍 Verificación de los Servicios

Una vez desplegados los contenedores, las 3 réplicas de la API estarán accesibles en el navegador o mediante curl:

- **Réplica 1:** [http://localhost:3000](http://localhost:3000)
- **Réplica 2:** [http://localhost:3001](http://localhost:3001)
- **Réplica 3:** [http://localhost:3002](http://localhost:3002)

### Ejemplo de respuesta JSON:
`json
{
  "laboratorio": "Laboratorio 02 - Docker Compose",
  "mensaje": "Hola desde la API! Estudiante: Valderrama Llajaruna Enrique",
  "puerto": "3000",
  "timestamp": "2026-09-10T15:00:00.000Z"
}
`

---

## 🌐 Explicación Teórica: Redes en Docker

Docker proporciona un subsistema de red flexible y modular a través de controladores de red (*network drivers*). A continuación se explican a fondo los tipos existentes:

### 1. ridge (Puente por defecto)
- **Descripción:** Es el driver predeterminado cuando se crea un contenedor independiente sin especificar red. Crea un puente de software interno en el host (docker0), asignando una dirección IP privada a cada contenedor dentro de esa subred (típicamente 172.17.0.0/16).
- **Limitación:** Los contenedores en la red ridge por defecto solo pueden comunicarse entre sí mediante sus direcciones IP, ya que **no** cuentan con resolución de nombres DNS automática.

### 2. Redes Personalizadas (User-defined bridge networks)
- **Descripción:** Redes bridge creadas explícitamente por el usuario o mediante Docker Compose (como pp_network en este proyecto).
- **Ventajas clave:**
  - **Resolución DNS automática:** Permite que los contenedores se descubran y comuniquen utilizando directamente los nombres de servicio o alias (por ejemplo, la API se conecta a db:5432 en lugar de una IP dinámica).
  - **Aislamiento superior:** Solo los contenedores conectados a esta red pueden comunicarse entre sí, impidiendo el acceso a contenedores ajenos.

### 3. host
- **Descripción:** Elimina el aislamiento de red entre el contenedor y el host. El contenedor comparte la pila de red directamente con la máquina anfitriona (no recibe una IP propia).
- **Uso:** Ideal para aplicaciones que requieren un rendimiento de red extremadamente alto y baja latencia, o para inspeccionar tráfico de red. No funciona en Docker Desktop para Windows/macOS debido a la capa de virtualización.

### 4. 
one
- **Descripción:** Deshabilita por completo la pila de red del contenedor. El contenedor solo cuenta con la interfaz de loopback (127.0.0.1) y no tiene acceso a internet ni a otros contenedores.
- **Uso:** Procesos de cálculo intensivo, procesamiento por lotes seguro o tareas donde se requiere aislamiento estricto contra cualquier comunicación externa.

### 5. overlay
- **Descripción:** Conecta múltiples demonios de Docker distribuidos en distintos hosts físicos o virtuales. Es el driver nativo utilizado en clústeres de **Docker Swarm**.
- **Uso:** Orquestación de servicios y microservicios a través de múltiples nodos físicos o en la nube con cifrado opcional del plano de datos.

### 6. macvlan
- **Descripción:** Asigna una dirección MAC física a cada contenedor, haciendo que aparezcan como dispositivos físicos directamente conectados a la red local física del router.
- **Uso:** Migración de aplicaciones heredadas (*legacy*) que requieren estar en la misma subred física que otros servidores de la empresa o que dependen de direccionamiento IP estático corporativo.

### 7. ipvlan
- **Descripción:** Similar a macvlan, pero los contenedores comparten la misma dirección MAC del adaptador físico del host mientras mantienen direcciones IP independientes (L2 o L3).
- **Uso:** Entornos donde los switches de red tienen restricciones en la cantidad de direcciones MAC permitidas por puerto o para arquitecturas con direccionamiento IPv4/IPv6 avanzado.

---

## 💾 Explicación Teórica: Volúmenes en Docker

En Docker, los contenedores son efímeros por defecto (si el contenedor se elimina, sus datos internos se pierden). Para gestionar la persistencia y compartir información existen cuatro mecanismos fundamentales:

### 1. Volúmenes con Nombre (Named Volumes)
- **Descripción:** Son directorios administrados íntegramente por el motor de Docker en una zona reservada del sistema de archivos del host (/var/lib/docker/volumes/ en Linux).
- **Características:**
  - Tienen un nombre explícito (como postgres_data en este laboratorio).
  - Son independientes del ciclo de vida del contenedor: si se destruye el contenedor de PostgreSQL, el volumen y los datos de las tablas permanecen intactos.
  - Es el método **recomendado oficialmente** por Docker para bases de datos y entornos de producción.

### 2. Montajes Vinculados (Bind Mounts)
- **Descripción:** Mapean un archivo o directorio específico del host directamente dentro del contenedor (por ejemplo, ./src:/usr/src/app/src).
- **Características:**
  - Dependen de la estructura del sistema de archivos del host.
  - Muy útiles en **desarrollo local** para reflejar cambios de código fuente en tiempo real (*hot reload*) sin tener que reconstruir la imagen.
  - Otorgan al contenedor acceso directo a permisos del host, por lo que deben usarse con precaución.

### 3. Montajes en Memoria (	mpfs Mounts)
- **Descripción:** Almacenan los archivos exclusivamente en la memoria RAM del host (no se escriben en disco).
- **Características:**
  - Si el contenedor se detiene, la información en 	mpfs se destruye inmediatamente.
  - **Uso:** Manejo de datos confidenciales no persistentes (claves privadas temporales, tokens en memoria) o para operaciones de alta velocidad I/O que no requieren persistencia.

### 4. Volúmenes Anónimos (Anonymous Volumes)
- **Descripción:** Volúmenes creados por Docker que no reciben un nombre específico por parte del usuario, sino un identificador alfanumérico largo (UUID).
- **Características:**
  - Suelen crearse automáticamente si un Dockerfile declara la instrucción VOLUME y el usuario no especifica un destino al ejecutar el contenedor.
  - Son más difíciles de rastrear y gestionar, y pueden acumularse como espacio no utilizado si no se limpian periódicamente con docker volume prune.

---

## 📸 Capturas de Pantalla

*(Espacio reservado para incluir las capturas del proyecto desplegado)*

### 1. Despliegue con Docker Compose (docker compose up -d)
> *Agrega aquí tu captura mostrando la compilación y puesta en marcha de los 4 contenedores.*

### 2. Estado de los Contenedores (docker compose ps)
> *Agrega aquí tu captura verificando que postgres_db, pi_service_1, pi_service_2 y pi_service_3 están en estado Up.*

### 3. Prueba de la API en los 3 puertos (3000, 3001, 3002)
> *Agrega aquí tu captura del navegador o terminal consumiendo los endpoints con el nombre de Valderrama Llajaruna Enrique.*

---

## 👤 Créditos

- **Estudiante / Autor:** Valderrama Llajaruna Enrique
- **Laboratorio:** Laboratorio 02 - Docker Compose
