#!/bin/bash
# Eatventure Bot - Dependency Installation Script

echo "=================================================="
echo "  Eatventure Bot - Installing Dependencies"
echo "=================================================="
echo ""

# Check if pip3 exists
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install Python 3 first."
    exit 1
fi

echo "📦 Installing Python packages..."
echo ""

pip3 install -r requirements.txt

echo ""
echo "=================================================="
echo "  Installation Complete!"
echo "=================================================="
echo ""
echo "✅ All dependencies installed"
echo ""
echo "Next steps:"
echo "  1. Verify setup: python3 verify_setup.py"
echo "  2. Configure game region in config.py"
echo "  3. Run the bot: python3 run.py"
echo ""
echo "📖 See QUICKSTART.md for detailed instructions"
echo ""
