//To compile, use
//g++ main.cpp -o server -std=c++11 -lboost_system -lpthread

#include <cstdlib>
#include <thread>
#include <iostream>
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

typedef websocketpp::server<websocketpp::config::asio> server;

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

typedef server::message_ptr message_ptr;

void on_message(server* s, websocketpp::connection_hdl hdl, message_ptr msg) {
	try {
		char outgoingMessage[5] = {'t', 'e', 's', 't', '\0'};
		std::cout << outgoingMessage << std::endl;
		s->send(hdl, outgoingMessage, msg->get_opcode());
	}
	catch (const websocketpp::lib::error_code& e) {
		std::cout << "Echo failed because: " << e << "(" << e.message() << ")" << std::endl;
	}
}

int main(int argc, char **argv) {
	std::cout << "Hi!" << std::endl;
	server echoServer;
	try {
		echoServer.set_access_channels(websocketpp::log::alevel::all);
		echoServer.clear_access_channels(websocketpp::log::alevel::frame_payload);
		echoServer.set_reuse_addr(true);
		echoServer.init_asio();
		echoServer.set_message_handler(bind(&on_message,&echoServer,::_1,::_2));
		echoServer.listen(9002);
		echoServer.start_accept();
		echoServer.run();
	}
	catch (websocketpp::exception const & e) {
		std::cout << e.what() << std::endl;
	}
	catch (...) {
		std::cout << "other exception" << std::endl;
	}
}