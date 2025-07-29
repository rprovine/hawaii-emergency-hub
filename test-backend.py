#!/usr/bin/env python3
"""
Test backend startup
"""
import subprocess
import time
import requests

print("🔧 Testing backend startup...")

# Start backend
process = subprocess.Popen(
    ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    cwd="backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for startup
print("⏳ Waiting for backend to start...")
time.sleep(5)

# Test if it's running
try:
    response = requests.get("http://localhost:8000")
    print(f"✅ Backend is running! Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test registration endpoint
    print("\n🧪 Testing registration endpoint...")
    reg_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }
    
    reg_response = requests.post(
        "http://localhost:8000/api/v1/auth/register",
        json=reg_data
    )
    
    print(f"Registration status: {reg_response.status_code}")
    if reg_response.status_code == 200:
        print("✅ Registration successful!")
    else:
        print(f"❌ Registration failed: {reg_response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nBackend output:")
    stdout, stderr = process.communicate(timeout=1)
    print("STDOUT:", stdout)
    print("STDERR:", stderr)

# Keep running
print("\n💡 Backend is running. Press Ctrl+C to stop.")
try:
    process.wait()
except KeyboardInterrupt:
    process.terminate()
    print("\n✋ Backend stopped.")