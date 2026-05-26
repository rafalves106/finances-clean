# --- Build Stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copiar o arquivo de solution
COPY Finance.slnx .

# 2. Copiar TODOS os .csproj para restaurar dependências
COPY API/API.csproj API/
COPY Core/Core.csproj Core/
COPY Infrastructure/Infrastructure.csproj Infrastructure/
COPY Tests/API.IntegrationTests/API.IntegrationTests.csproj Tests/API.IntegrationTests/

# 3. Restaurar dependências da solution inteira
RUN dotnet restore Finance.slnx

# 4. Copiar o restante do código
COPY . .

# 5. Publicar apenas o projeto API
RUN dotnet publish API/API.csproj -c Release -o /out

# --- Runtime Stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
RUN apt-get update \
		&& apt-get install -y --no-install-recommends curl \
		&& rm -rf /var/lib/apt/lists/*
COPY --from=build /out .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
HEALTHCHECK --interval=10s --timeout=3s --retries=10 --start-period=20s \
	CMD curl -fsS http://localhost:5000/ready || exit 1
ENTRYPOINT ["dotnet", "API.dll"]