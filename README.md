# ResiCast README

## Overview
**ResiCast** is a sophisticated wrapper around FFmpeg designed to streamline the process of generating FFmpeg commands for each Adapter, selecting TV programs, and multiplexing the output to the DD RESI SDR DVB-T/T2 Modulator. 
It utilizes a Python virtual environment to manage dependencies and run a FastAPI server. The provided Makefile simplifies the setup and running of the project.

## Adapters Page

### Create Adapter

On the Adapters page, you can create a new Adapter by filling out a simple form. You'll need to:

1. **Enter an adapter name.**
2. **Select an available adapter and modulator.**
3. **Provide a UDP link for `MPTS` or links `SPTS` type** containing the MPEG transport stream.

> Most of my testing has been conducted using UDP links to `SPTS` (Single Program Transport Stream) from the [Astra Cesbo](https://www.cesbo.com/) application. 

### Scan and Select programs

Once the Adapter is created, you can scan it to discover all available TV Programs from the UDP inputs. The scanning process may take some time.

After scanning, it's crucial to select and save the desired TV programs. Note that you don't need to add a UDP link for channels you don't wish to select TV programs from.

> **Important:** Currently, the RESI SDR card supports modulation only at 8MHz and DVB-T standard, with a maximum bitrate of 31Mb. It’s essential to ensure that the total input bitrate of all SPTS UDP URLs is less than 31Mb. For satellite streams, exercise caution when adding streams exceeding 20Mb to the Modulator, as the bitrate of specific programs can spike significantly.

Additionally, you can add an 'MPTS' (Multiprogram Transport Stream) UDP URL. 
This allows multiple TV programs to be retrieved from a single URL. However, be aware of potential issues with programs that have different video/audio codecs and problems with subtitles. After scanning MPTS adapters, you can select only the necessary TV programs and streams (video/audio/subtitles).

## Modulators Page

On the Modulators page, you can configure the frequency and output power (in dBμV) for each Modulator. Changes to the Modulator settings can only be applied when all adapters are stopped.

## Logs Page

The Logs page provides a quick, real-time overview of logs. All logs are stored in the `/resicast/logs/` directory for easy access.

## Info Page

Currently, the Info page displays temperature readings from the sensors on the RESI SDR card, offering a quick way to monitor the card's thermal status.

---

# Setup Instructions

### Prerequisites

- Python 3.x installed on your machine.
- Git installed on your machine.

### Cloning the Repository

To clone the repository, run:

```sh
wget https://github.com/paliydmn/resicast.git
```

Navigate into the project directory:

```sh
cd resicast
```

### Using the Makefile

The Makefile provided contains commands to set up and run the project.

#### 1. Install Dependencies

To create a virtual environment, install dependencies, and set up the project, run:

```sh
make install
```

This command will:

- Create a virtual environment.
- Activate the virtual environment (platform-specific).
- Install the required Python packages listed in `requirements.txt`.

#### 2. Run the Server in dev mode

To start the FastAPI server, run:

```sh
make run_dev
```

This command will:

- Ensure the virtual environment is activated.
- Start the FastAPI server using `uvicorn`.

**Run the server with Custom PORT**

```sh
make run_dev PORT=<port_number>
```
Where `<port_number>`, for instance `8200`. 

#### 3. Initializing the ResiCast Service

The `init` command in the `Makefile` sets up ResiCast as a systemd service, ensuring that the application runs automatically in the background and restarts if it crashes. This command creates a systemd service file tailored to your environment and starts the service. 

### How It Works

When you run `make init`, the following steps are performed:

1. **Creating the Systemd Service File:**
   - A new service file named `resicast.service` is generated under `/etc/systemd/system/`.
   - The file includes configurations such as the service description, the user under which the service runs, and the working directory.

2. **Setting Up the Service:**
   - The `ExecStart` command specifies the path to `uvicorn` within your Python virtual environment, ensuring the FastAPI application starts with the specified host and port.
   - The service is configured to restart automatically if it crashes, with a delay of 3 seconds between restarts.

3. **Reloading and Enabling the Service:**
   - After creating the service file, the systemd daemon is reloaded to recognize the new service.
   - The ResiCast service is then enabled to start on boot and immediately started.

### Usage

To initialize the ResiCast service, simply run:

```bash
make init
```

### Example Output

Running `make init` will produce output similar to the following:

```plaintext
Creating systemd service for ResiCast...
Reloading systemd daemon...
Enabling and starting ResiCast service...
ResiCast service initialized successfully.
```

Or with Custom Port: 
```bash
make init PORT=8010
```

After running this command, ResiCast will be running as a systemd service, and you can manage it using standard systemd commands like `sudo systemctl status resicast.service`, `sudo systemctl restart resicast.service`, and `sudo systemctl stop resicast.service`.

## Accessing the Web UI

Once the server is running, you can access the web user interface (UI) through your web browser. Open your web browser and navigate to:
**Default port**
 - default port is `8008`, if it is not indicated in `settings.py` file or `make run_dev`, `make init` commands. 
```
http://<localhost/server_IP>:8008
```

This will bring up the home page of the web UI where you can interact with the various features of the application, such as configuring adapters and managing streams.

## Log Files

### Location

Log files for FFmpeg processes are stored in the `resicast/logs/` directory. Each log file is named according to the <adapter name>_<adapter id>, following the format `ff_<adapter_name>_<adapter_id>.log`. 

Server logs are loacted at `logs/resicast.log` file.

### Viewing Logs

To view the log files:

1. **Navigate to the Logs Directory**: Open your terminal or file explorer and go to the `app/logs` directory within your project.

2. **Open the Log File**: Use a text editor or viewer of your choice to open the log file corresponding to the adapter you are interested in. For example:
   - **For Adapter #1**: `tail -f ff_name_id.log`
   - **For Adapter #2**: `less ff_name_id.log`

3. **Monitor Logs**: Logs are continuously updated with output from FFmpeg. The files include detailed information about the FFmpeg process, including both standard output and error messages.

### Log Rotation

Log files are managed with rotation enabled. Each log file will be rotated when it reaches a size of 1 MB, and up to 3 backup copies will be kept. Older log files are automatically archived to prevent excessive disk usage.
You may set up the log settings at `resicast/settings.py` file (retsart the service or server after settings change)

---

### Manual Steps (if needed)

If you encounter issues with the Makefile or need to perform setup manually, follow these steps:

#### Create and Activate Virtual Environment

Create the virtual environment:

```sh
python -m venv venv
```

Activate the virtual environment:

- **On Windows:**

  ```sh
  venv\Scripts\activate
  ```

- **On Unix or macOS:**

  ```sh
  source venv/bin/activate
  ```

#### Install Dependencies

With the virtual environment activated, install the required dependencies:

```sh
pip install -r requirements.txt
```

#### Run the Server

With the virtual environment activated, start the FastAPI server:

```sh
uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload
```

## Git Ignore

Make sure to add `__pycache__` directories to `.gitignore` to prevent caching files from being tracked by Git:

Add the following line to `.gitignore`:

```
__pycache__/
```

## Additional Notes

- Ensure that your virtual environment is activated before running any Python commands.
- If you make changes to the project, commit and push them as necessary.

---

## Licensing and Copyright

This project uses FFmpeg, a free software project that is licensed under the GNU Lesser General Public License (LGPL) version 2.1 or later, and the GNU General Public License (GPL) version 2 or later. For more information, refer to the FFmpeg licensing documentation and the licenses included with the FFmpeg source code.

### FFmpeg Licensing

[FFmpeg](https://github.com/FFmpeg/FFmpeg) is licensed under the following licenses:
- **LGPL v2.1**: The LGPL license applies to the FFmpeg libraries. You can find the full text of the LGPL license [here](https://www.gnu.org/licenses/lgpl-2.1.html).
- **GPL v2**: The GPL license applies to FFmpeg components. You can find the full text of the GPL license [here](https://www.gnu.org/licenses/gpl-2.0.html).

FFmpeg is a registered trademark of the FFmpeg project. 

### Acknowledgments

We acknowledge and thank the FFmpeg project for providing this powerful multimedia framework.

---
