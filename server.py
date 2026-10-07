#!/usr/bin/env python3
"""
Simple HTTP server with firmware listing API
Serves static files and provides /api/firmware endpoint
"""
import http.server
import socketserver
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

class FirmwareHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Enhanced HTTP handler with firmware API"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        # API endpoint for firmware list
        if parsed_path.path == '/api/firmware':
            self.send_firmware_list()
        else:
            # Serve static files normally
            super().do_GET()
    
    def send_firmware_list(self):
        """Send list of firmware files as JSON"""
        try:
            firmware_dir = Path('firmware')
            if not firmware_dir.exists():
                firmware_dir.mkdir(exist_ok=True)
            
            # Get all .bin files
            firmware_files = []
            for file in sorted(firmware_dir.glob('*.bin')):
                stat = file.stat()
                firmware_files.append({
                    'name': file.name,
                    'path': f'firmware/{file.name}',
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
            
            # Send JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(firmware_files, indent=2).encode())
            
        except Exception as e:
            self.send_error(500, f'Error listing firmware: {str(e)}')
    
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    """Start the server"""
    PORT = 8080
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), FirmwareHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        print(f"Firmware API at http://localhost:{PORT}/api/firmware")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == '__main__':
    main()
