# Problema de DNS con MongoDB Atlas en Docker

## Problema
El contenedor `leads-service` no puede resolver el DNS de MongoDB Atlas (`ENOTFOUND`).

## Solución 1: Ejecutar leads-service fuera de Docker (Desarrollo)

1. Detener el leads-service en Docker:
```powershell
docker-compose stop leads-service
docker-compose rm -f leads-service
```

2. Instalar dependencias localmente:
```powershell
cd services/leads-service
npm install
```

3. Ejecutar el servicio:
```powershell
npm run dev
```

4. Actualizar el docker-compose.yml para que api-gateway se conecte al servicio local:
   - Cambiar `LEADS_SERVICE_URL` a `http://host.docker.internal:4001` en el .env del gateway
   - O usar `localhost:4001` si ejecutas el gateway también fuera de Docker

## Solución 2: Configurar DNS en Docker Desktop

1. Abre Docker Desktop
2. Ve a Settings > Resources > Network
3. Configura DNS servers: `8.8.8.8,8.8.4.4`
4. Reinicia Docker Desktop
5. Vuelve a ejecutar: `docker-compose up -d`

## Solución 3: Usar conexión directa (mongodb://)

Si tienes las IPs del cluster, puedes usar:
```
mongodb://jc7236352:1234@cluster-prueba-shard-00-00.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-01.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-02.jkp6r.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

Pero necesitas obtener la conexión estándar desde MongoDB Atlas.

## Verificación

Verifica que el DNS funciona:
```powershell
docker exec leads-service nslookup cluster-prueba.jkp6r.mongodb.net
```

Si no funciona, usa la Solución 1 para desarrollo.
