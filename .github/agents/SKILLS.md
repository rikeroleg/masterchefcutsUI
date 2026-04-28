# Agent Skills

## Starting the App

When the user says "start the app", start BOTH:

### Frontend
```powershell
cd "c:\DEV Repos\aidevops\masterchefcutsUI"
npm run dev
```
Runs on `http://localhost:5173`

### Backend
```powershell
cd "c:\DEV Repos\aidevops\MasterCheifCuts"
docker compose up sqlserver sqlserver-setup --detach
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
Runs on `http://localhost:8080`  
Reads credentials from `src/main/resources/application-local-secrets.properties` (gitignored)

## Running Tests

### Frontend tests
```powershell
cd "c:\DEV Repos\aidevops\masterchefcutsUI"
npm run test
```

### Backend tests
```powershell
cd "c:\DEV Repos\aidevops\MasterCheifCuts"
./mvnw test
```

## Building for Production

### Frontend
```powershell
cd "c:\DEV Repos\aidevops\masterchefcutsUI"
npm run build
# Output in dist/
```

### Backend
```powershell
cd "c:\DEV Repos\aidevops\MasterCheifCuts"
./mvnw clean package -DskipTests
# Output: target/masterchefcuts-0.0.1-SNAPSHOT.jar
```
