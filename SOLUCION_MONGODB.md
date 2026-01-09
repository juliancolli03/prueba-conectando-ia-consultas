# Solución: Problema de DNS con MongoDB Atlas

## Problema
El error `querySrv ENOTFOUND` indica que tu sistema no puede resolver el DNS SRV de MongoDB Atlas.

## Solución: Usar conexión directa (mongodb://)

1. Ve a MongoDB Atlas: https://cloud.mongodb.com
2. Selecciona tu cluster "Cluster-prueba"
3. Click en "Connect" > "Connect your application"
4. Selecciona "Driver: Node.js" y "Version: 5.5 or later"
5. Copia la conexión que empiece con `mongodb://` (NO `mongodb+srv://`)
6. Debería verse algo como:
   ```
   mongodb://jc7236352:1234@cluster-prueba-shard-00-00.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-01.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-02.jkp6r.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```

7. Actualiza el archivo `.env` del leads-service:
   ```env
   MONGODB_URI=mongodb://jc7236352:1234@cluster-prueba-shard-00-00.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-01.jkp6r.mongodb.net:27017,cluster-prueba-shard-00-02.jkp6r.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```

8. Vuelve a ejecutar el servicio

## Alternativa: Verificar DNS en Windows

Si prefieres usar `mongodb+srv://`, verifica tu DNS:

```powershell
# Probar resolución DNS
nslookup cluster-prueba.jkp6r.mongodb.net

# Si falla, cambia tu DNS a Google DNS:
# 1. Abre "Configuración de red" en Windows
# 2. Cambia DNS a: 8.8.8.8 y 8.8.4.4
# 3. Reinicia
```

La solución más rápida es usar `mongodb://` (conexión directa).
