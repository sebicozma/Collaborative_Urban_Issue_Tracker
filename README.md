# Collaborative_Urban_Issue_Tracker

The Collaborative Urban Issue Tracker is a distributed, event-driven platform that allows citizens to report
local infrastructure problems (potholes, broken lights, graffiti) via a mobile app. GPS coordinates
automatically route each report to the responsible regional server. A microservices architecture separates
concerns across eight independently deployable components, connected through a combination of
synchronous REST/gRPC calls and asynchronous RabbitMQ events. An AI classification service
automatically categorises reports by type and urgency and detects duplicates using a multimodal vision
model.

Project developed as part of the Advanced Distributed Applications course at Universitatea Politehnica Timișoara.

Team members:
Copilu Tudor, 
Cozma Gabriel,
Dobre Andrei, 
Gherasim-Piroska Robert
