#include <iostream>
#include <fstream>
using namespace std;

int main(int argc, char** argv){
	string in1[] = {"jquery_dev.js", "neuralNetwork.js", "mario.js", "smartAI.js", "script.js"};
	int in1length = 5;
	string out1 = "bundled_script.js";
	
	ofstream out2(out1.c_str());
  if (out2.is_open()){
    for(int i = 0; i < in1length; ++i){
      out2 << "/* " << in1[i] << " */\n\n";
      string line;
      ifstream in2(in1[i].c_str());
      if(in2.is_open()){
        while(getline(in2, line)){
          out2 << line << "\n";
        }
        in2.close();
        out2 << "\n\n";
      }
      else cout << "Unable to open file " << in1[i] << endl;
    }
    out2.close();
  }
  else cout << "Unable to open file " << out1 << endl;
  return 0;
}
