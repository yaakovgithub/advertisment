using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
// distance in km
static double Haversine(double lat1, double lon1, double lat2, double lon2)
{
    const double R = 6371; // km
    double dLat = Deg2Rad(lat2 - lat1), dLon = Deg2Rad(lon2 - lon1);
    double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
             + Math.Cos(Deg2Rad(lat1)) * Math.Cos(Deg2Rad(lat2))
             * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
    return 2 * R * Math.Asin(Math.Min(1, Math.Sqrt(a)));
    static double Deg2Rad(double d) => d * Math.PI / 180d;
}

// CORS for Angular dev server:
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p
    .AllowAnyOrigin()
       // .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()));

builder.Services.AddSingleton<AdsStore>();
var app = builder.Build();
app.UseCors();

app.MapGet("/", () => Results.Redirect("/ads"));

app.MapGet("/ads", (AdsStore store, string? q, string? category, int? minPrice, int? maxPrice,
                    double? lat, double? lng, int? radiusMeters) =>
{
    var ads = store.GetAll();

    if (!string.IsNullOrWhiteSpace(q))
        ads = ads.Where(a => (a.Title + " " + a.Description)
                    .Contains(q, StringComparison.OrdinalIgnoreCase));

    if (!string.IsNullOrWhiteSpace(category))
        ads = ads.Where(a => string.Equals(a.Category, category, StringComparison.OrdinalIgnoreCase));

    if (minPrice is not null) ads = ads.Where(a => a.Price >= minPrice);
    if (maxPrice is not null) ads = ads.Where(a => a.Price <= maxPrice);

    if (lat is not null && lng is not null && radiusMeters is not null)
        ads = ads.Where(a => a.Lat is not null && a.Lng is not null &&
            Haversine(a.Lat!.Value, a.Lng!.Value, lat.Value, lng.Value) * 1000 <= radiusMeters);

    return Results.Ok(ads.OrderByDescending(a => a.CreatedAt));
});

app.MapGet("/ads/{id}", (AdsStore store, Guid id) =>
    store.TryGet(id, out var ad) ? Results.Ok(ad) : Results.NotFound());

app.MapPost("/ads", (AdsStore store, AdDto dto) =>
{
    var ad = Ad.FromDto(dto);
    store.Upsert(ad);
    return Results.Created($"/ads/{ad.Id}", ad);
});

app.MapPut("/ads/{id}", (AdsStore store, Guid id, AdDto dto) =>
{
    if (!store.TryGet(id, out var existing)) return Results.NotFound();
    existing.UpdateFrom(dto);
    store.Upsert(existing);
    return Results.Ok(existing);
});

app.MapDelete("/ads/{id}", (AdsStore store, Guid id) =>
{
    return store.Remove(id) ? Results.NoContent() : Results.NotFound();
});

app.Run();

// ---- models & store ----
record Ad(
    Guid Id,
    string Title,
    string Description,
    string Category,
    int Price,
    string? ImageUrl,
    double? Lat,
    double? Lng,
    DateTime CreatedAt)
{
    public static Ad FromDto(AdDto dto) =>
        new(Guid.NewGuid(), dto.Title, dto.Description, dto.Category, dto.Price,
            dto.ImageUrl, dto.Lat, dto.Lng, DateTime.UtcNow);

    public Ad UpdateFrom(AdDto dto)
        => this with
        {
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            Price = dto.Price,
            ImageUrl = dto.ImageUrl,
            Lat = dto.Lat,
            Lng = dto.Lng
        };
}

record AdDto(
    string Title,
    string Description,
    string Category,
    int Price,
    string? ImageUrl,
    double? Lat,
    double? Lng);

class AdsStore
{
    private readonly string _file;
    private readonly JsonSerializerOptions _opt = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
    private readonly ConcurrentDictionary<Guid, Ad> _db;

    public AdsStore(IWebHostEnvironment env)
    {
        _file = Path.Combine(env.ContentRootPath, "ads.json");
        _db = new(ReadFile().ToDictionary(a => a.Id, a => a));
    }

    public IEnumerable<Ad> GetAll() => _db.Values;
    public bool TryGet(Guid id, out Ad ad) => _db.TryGetValue(id, out ad!);

    public void Upsert(Ad ad)
    {
        _db[ad.Id] = ad;
        Persist();
    }

    public bool Remove(Guid id)
    {
        var ok = _db.TryRemove(id, out _);
        if (ok) Persist();
        return ok;
    }

    private IEnumerable<Ad> ReadFile()
    {
        if (!File.Exists(_file)) return Enumerable.Empty<Ad>();
        var json = File.ReadAllText(_file);
        return JsonSerializer.Deserialize<List<Ad>>(json) ?? new();
    }

    private void Persist()
    {
        var list = _db.Values.OrderByDescending(a => a.CreatedAt).ToList();
        File.WriteAllText(_file, JsonSerializer.Serialize(list, _opt));
    }
}

