import matplotlib.pyplot as plt

# Data for the graph
brands = ["Boost", "Bournvita", "Horlicks", "Complan"]
positioning = [1, 2, 3, 4]  # Market positioning scores
prices = [60, 70, 75, 90]  # Price per 100g in local currency
colors = ["red", "blue", "orange", "green"]
sizes = [100, 150, 150, 150]  # Sizes of points for better visibility

# Plotting the graph
plt.figure(figsize=(10, 6))
for i in range(len(brands)):
    plt.scatter(positioning[i], prices[i], color=colors[i], s=sizes[i], label=brands[i], edgecolor='black')
    plt.text(positioning[i] + 0.05, prices[i], brands[i], fontsize=12, weight='bold', color=colors[i])

# Title and labels with improved styling
plt.title("Market Positioning vs. Price Range", fontsize=16, weight='bold', color='navy')
plt.xlabel("Market Positioning (1 = Mainstream, 4 = High Premium)", fontsize=12, color='purple', weight='bold')
plt.ylabel("Price (per 100g pack in local currency)", fontsize=12, color='purple', weight='bold')

# Grid and background styling
plt.grid(color='lightgray', linestyle='--', linewidth=0.5)
plt.gca().set_facecolor('#f9f9f9')  # Light background color for contrast

# Legend
plt.legend(loc="upper left", fontsize=12)

# Show the plot
plt.show()
