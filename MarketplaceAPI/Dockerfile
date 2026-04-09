# Stage 1: Restore
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MarketplaceAPI.csproj", "."]
RUN dotnet restore

# Stage 2: Publish
FROM build AS publish
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "MarketplaceAPI.dll"]