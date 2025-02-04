<?php
function cors () {
	header("Access-Control-Allow-Origin: *");
  }

  function sendResponse ($res) {
	header("Content-type: application/json");
	header("Access-Control-Allow-Origin: *");
	if ($res["error"]) {
		http_response_code(400);
	} else {
		http_response_code(200);
	}

	echo json_encode($res); 
  }


  // https://stackoverflow.com/questions/3407939/shell-exec-timeout-management-exec
  function execute($cmd, $stdin=null, &$stdout, &$stderr, $timeout=false)
  {
      $pipes = array();
      $process = proc_open(
          $cmd,
          array(array('pipe','r'),array('pipe','w'),array('pipe','w')),
          $pipes
      );
      $start = time();
      $stdout = '';
      $stderr = '';
  
      if(is_resource($process))
      {
          stream_set_blocking($pipes[0], 0);
          stream_set_blocking($pipes[1], 0);
          stream_set_blocking($pipes[2], 0);
          fwrite($pipes[0], $stdin);
          fclose($pipes[0]);
      }
  
      while(is_resource($process))
      {
          //echo ".";
          $stdout .= stream_get_contents($pipes[1]);
          $stderr .= stream_get_contents($pipes[2]);
  
          if($timeout !== false && time() - $start > $timeout)
          {
              proc_terminate($process, 9);
              return 1;
          }
  
          $status = proc_get_status($process);
          if(!$status['running'])
          {
              fclose($pipes[1]);
              fclose($pipes[2]);
              proc_close($process);
              return $status['exitcode'];
          }
  
          usleep(100000);
      }
  
      return 1;
  }