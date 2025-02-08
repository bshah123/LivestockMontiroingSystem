from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import numpy as np
from collections import deque
from flask_cors import CORS
import pandas as pd

# Load the trained LSTM autoencoder model
model_path = 'models/livestock_anomaly_detector_updated.h5'
model = load_model(model_path)

# Load and prepare historical data for scaling
historical_data = pd.read_csv('history_data.csv')
historical_data = pd.DataFrame(historical_data)
historical_data.drop(columns=['Time'], inplace=True)

# Flask app setup
app = Flask(__name__)
CORS(app, resources={r"/detect_anomaly": {"origins": "*"}})


# Define anomaly detection threshold
THRESHOLD = 0.05  # Adjust based on model performance

# Initialize a buffer to store the last 5 data points for each setup
buffers = {}

# Initialize MinMaxScaler (fit with historical data if available)
scaler = MinMaxScaler()
scaler.fit(historical_data)

# Endpoint to receive data from the web interface
@app.route('/detect_anomaly', methods=['POST'])
def api_detect_anomaly():
    try:
        # Parse the incoming data from the JSON payload
        setup = request.json.get('setup')
        incoming_data = request.json.get('data')
        print(setup, incoming_data)

        print(f"Received data for setup {setup}: {incoming_data}")

        if incoming_data is None or setup is None:
            return jsonify({'error': 'No data or setup provided'}), 400

        # Ensure a buffer exists for the current setup
        if setup not in buffers:
            buffers[setup] = deque(maxlen=5)

        # Convert incoming data to numpy array and ensure data types are compatible
        data_point = np.array(incoming_data).reshape(1, -1).astype(np.float32)

        # Scale the data point using the pre-fitted scaler
        scaled_data = scaler.transform(data_point)

        # Convert scaled data to float to avoid JSON serialization issues
        scaled_data = scaled_data.astype(float)
        print("Scaled data:", scaled_data)

        # Add the scaled data point to the buffer for the specified setup
        buffers[setup].append(scaled_data[0])

        # Perform anomaly detection if buffer has 5 time steps
        if len(buffers[setup]) == 5:
            # Convert buffer to numpy array of shape (1, 5, features) for model input
            data = np.array(buffers[setup]).reshape(1, 5, -1)

            # Predict with the model
            reconstructed_data = model.predict(data)
            print("Reconstructed data:", reconstructed_data)
            mse = np.mean(np.power(data - reconstructed_data, 2))

            # Check if anomaly is detected
            is_anomaly = mse > THRESHOLD
            if is_anomaly:
                print('Anomaly detected! MSE:', mse)
                return jsonify({'alert': f'Anomaly detected in {setup}!', 'mse': mse})
            else:
                print('No anomaly detected. MSE:', mse)
                return jsonify({'status': 'No anomaly detected', 'mse': mse})
        else:
            # If buffer has fewer than 5 data points, inform the client
            print('Buffering data for setup:', setup, 'Buffer size:', len(buffers[setup]))
            return jsonify({'status': 'Buffering data', 'buffer_size': len(buffers[setup])})

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
