/**
 *    author:  shagun
 *    created: 2025-01-28 17:24:41
 **/
#include <bits/stdc++.h>
using namespace std;
mt19937_64 RNG(chrono::steady_clock::now().time_since_epoch().count());
#define fastIO                        \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL);
#define int long long
#define all(x) (x).begin(), (x).end()
typedef vector<int> vi;
typedef vector<bool> vb;
typedef vector<vi> vvi;
typedef vector<pair<int, int>> vpi;
#define f first
#define s second
#define yes cout << "YES" << endl
#define ll long long
#define no cout << "NO" << endl
#define endl "\n"
const int mod = 1000000007;
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
void solve()
{
    ll n, q;
    cin >> n >> q;
    vector<ll> arr(200100, 0);
    vector<ll> p(n);
    for (int i = 0; i < n; i++)
    {
        cin >> p[i];
    }
    sort(p.begin(), p.end());
    for (int i = 0; i < q; i++)
    {
        ll a, b;
        cin >> a >> b;
        arr[a]++;
        arr[b + 1]--;
    }
    int r = 0;
    int pq = -1;
    for (int i = 1; i < n + 1; i++)
    {
        if (arr[i] != 0)
        {
            r = arr[i];
            pq = i;
            break;
        }
    }
    int c = pq + 1;
    for (int i = c; i < n + 1; i++)
    {
        r += arr[i];
        arr[i] = r;
    }

    // //2 3 2
    // 1 0 -1
    // 1 1 -1 -1
    // 2 1 -1 -2
    // 1 3 3 1 1
    sort(arr.begin() + 1, arr.begin() + n + 1);
    sort(p.begin(), p.end());
    ll y = 0;
    // for (int i = 1; i, n + 1; i++)
    // {
    //     cout << arr[i] << " ";
    // }
    // cout << endl;
    // for (int i = 0; i < n; i++)
    // {
    //     cout << p[i] << " ";
    // }
    // 1 2 3 4 5
    // 1 1 1 3 3
    // 1+2+3+12+15
    //
    for (int i = n; i > 0; i--)
    {
        y += (p[i - 1] * arr[i]);
    }
    cout << y << endl;
    return;
}

signed main()
{
    fastIO;
    int t = 1;
    while (t--)
    {
        solve();
    }
    return 0;
}