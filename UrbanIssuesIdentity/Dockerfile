FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY UrbanIssuesIdentity/UrbanIssuesIdentity.csproj UrbanIssuesIdentity/
RUN dotnet restore UrbanIssuesIdentity/UrbanIssuesIdentity.csproj

COPY UrbanIssuesIdentity/ UrbanIssuesIdentity/
RUN dotnet publish UrbanIssuesIdentity/UrbanIssuesIdentity.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=5222
EXPOSE 5222

ENTRYPOINT ["dotnet", "UrbanIssuesIdentity.dll"]
