/** Pretend file systems for the practice terminals in Python, NumPy and the Command Line. */

export const HOME_FILES: Record<string, string> = {
  "/home/asha/notes.txt": "Buy a new charger\nAsk about the GPU quota\nRead the attention paper\n",
  "/home/asha/projects/mnist/train.py": "print(\"training...\")\n",
  "/home/asha/projects/mnist/README.md": "# MNIST\nA first classifier.\n",
  "/home/asha/projects/essay/draft.md": "# Draft\n",
  "/home/asha/data/orders.csv": "date,city,amount\n2026-11-01,Pune,450\n",
  "/home/asha/.bashrc": "export EDITOR=nano\n",
};

export const ORDERS =
  "date,city,amount\n2026-11-01,Pune,450\n2026-11-01,Delhi,1200\n2026-11-02,Pune,300\n2026-11-02,Chennai,800\n2026-11-03,Pune,950\n2026-11-03,Delhi,200\n2026-11-04,Mumbai,700\n";

export const PIPE_FILES: Record<string, string> = {
  "/home/asha/orders.csv": ORDERS,
  "/home/asha/city.sh": "#!/bin/bash\n# Count the orders from one city, given as the first argument\ngrep -c \"$1\" orders.csv\n",
};
