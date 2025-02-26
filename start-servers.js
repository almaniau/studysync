const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      // Port is in use
      resolve(false);
    });
    
    server.once('listening', () => {
      // Port is available, close the server
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to find an available port starting from the given port
async function findAvailablePort(startPort) {
  let port = startPort;
  
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying ${port + 1}...`);
    port++;
  }
  
  return port;
}

// Function to start a server with the given command in the specified directory
function startServer(command, args, cwd, name) {
  console.log(`Starting ${name} server in ${cwd}...`);
  
  const serverProcess = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Error starting ${name} server:`, error);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`${name} server process exited with code ${code}`);
    }
  });
  
  return serverProcess;
}

// Function to update frontend .env.local file with the correct backend URL and frontend URL
function updateFrontendEnv(frontendDir, backendPort, frontendPort) {
  const envPath = path.join(frontendDir, '.env.local');
  
  try {
    // Check if .env.local exists
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      // Read existing content
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add NEXT_PUBLIC_API_URL
      if (envContent.includes('NEXT_PUBLIC_API_URL=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_API_URL=.*/,
          `NEXT_PUBLIC_API_URL=http://localhost:${backendPort}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_API_URL=http://localhost:${backendPort}`;
      }
      
      // Replace or add NEXTAUTH_URL
      if (envContent.includes('NEXTAUTH_URL=')) {
        envContent = envContent.replace(
          /NEXTAUTH_URL=.*/,
          `NEXTAUTH_URL=http://localhost:${frontendPort}`
        );
      } else {
        envContent += `\nNEXTAUTH_URL=http://localhost:${frontendPort}`;
      }
    } else {
      // Create new .env.local file
      envContent = `NEXT_PUBLIC_API_URL=http://localhost:${backendPort}\nNEXTAUTH_URL=http://localhost:${frontendPort}\n`;
    }
    
    // Write updated content
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated frontend .env.local with:
- Backend URL: http://localhost:${backendPort}
- Frontend URL: http://localhost:${frontendPort}`);
  } catch (error) {
    console.error('Error updating frontend .env.local file:', error);
  }
}

// Main function to start both servers
async function startServers() {
  try {
    // Find available ports
    const backendPort = await findAvailablePort(5000);
    const frontendPort = await findAvailablePort(3000);
    
    console.log(`Using port ${backendPort} for backend server`);
    console.log(`Using port ${frontendPort} for frontend server`);
    
    // Get current directory
    const currentDir = process.cwd();
    const backendDir = path.join(currentDir, 'backend');
    const frontendDir = path.join(currentDir, 'frontend');
    
    // Update frontend .env.local with the correct backend URL and frontend URL
    updateFrontendEnv(frontendDir, backendPort, frontendPort);
    
    // Set environment variables for backend
    process.env.PORT = backendPort;
    
    // Start backend server
    const backendProcess = startServer(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'dev'],
      backendDir,
      'Backend'
    );
    
    // Start frontend server
    const frontendProcess = startServer(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'dev', '--', '-p', frontendPort.toString()],
      frontendDir,
      'Frontend'
    );
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down servers...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting servers:', error);
  }
}

// Start the servers
startServers();
