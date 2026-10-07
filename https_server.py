#!/usr/bin/env python3
"""
Simple HTTPS server for local development
Generates a self-signed certificate on first run
"""
import http.server
import ssl
import os
import sys
from pathlib import Path

def generate_self_signed_cert(certfile, keyfile):
    """Generate a self-signed certificate for local testing"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        import ipaddress
        
        # Generate private key
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"State"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, u"City"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Local Dev"),
            x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(u"localhost"),
                x509.DNSName(u"127.0.0.1"),
                x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1")),
            ]),
            critical=False,
        ).sign(key, hashes.SHA256(), default_backend())
        
        # Write private key
        with open(keyfile, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Write certificate
        with open(certfile, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        print(f"✓ Generated self-signed certificate: {certfile}")
        return True
        
    except ImportError:
        print("⚠ Warning: 'cryptography' module not installed.")
        print("  To enable HTTPS with self-signed cert, install it with:")
        print("  pip install cryptography")
        return False

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8443
    
    # Check for existing certificate
    certfile = "localhost.pem"
    keyfile = "localhost-key.pem"
    
    if not os.path.exists(certfile) or not os.path.exists(keyfile):
        print("Certificate not found. Attempting to generate...")
        if not generate_self_signed_cert(certfile, keyfile):
            print("\n⚠ Cannot generate certificate. Falling back to HTTP...")
            print(f"Starting HTTP server on port {port}")
            server_address = ('', port)
            httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
            print(f"Serving HTTP on 0.0.0.0 port {port} (http://0.0.0.0:{port}/) ...")
            httpd.serve_forever()
            return
    
    # Create HTTPS server
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    # Wrap socket with SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile, keyfile)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"✓ Serving HTTPS on 0.0.0.0 port {port} (https://0.0.0.0:{port}/) ...")
    print(f"⚠ Using self-signed certificate - browsers will show security warning")
    print(f"  Accept the warning to continue (this is safe for local development)")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()
