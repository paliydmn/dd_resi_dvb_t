# Project README

## Overview

Project is based on FFMPEG utility. Developed for managing UDP MPEGTS streams to write to the DD RESI DVB-T/T2 Modulator. 
This project utilizes a Python virtual environment to manage dependencies and run a FastAPI server. The provided Makefile simplifies the setup and running of the project.

## Setup Instructions

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

## Accessing the Web UI

Once the server is running, you can access the web user interface (UI) through your web browser. Open your web browser and navigate to:
**Default port**
 - default port is `8008`, if port is not indicated custome one in `settings.py`, `make run_dev` or `make init` commands. 
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

FFmpeg is licensed under the following licenses:
- **LGPL v2.1**: The LGPL license applies to the FFmpeg libraries. You can find the full text of the LGPL license [here](https://www.gnu.org/licenses/lgpl-2.1.html).
- **GPL v2**: The GPL license applies to FFmpeg components. You can find the full text of the GPL license [here](https://www.gnu.org/licenses/gpl-2.0.html).

FFmpeg is a registered trademark of the FFmpeg project. 

### Acknowledgments

We acknowledge and thank the FFmpeg project for providing this powerful multimedia framework.

---
