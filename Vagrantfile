Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"

  config.vm.define "e2e" do |node|
      node.vm.provision :shell, path: "bootstrap.sh"
  end

  config.vm.define "registry" do |node|
    node.vm.provision "docker", images: [ "dickeyxxx/npm-register" ] do |docker|
        docker.run "dickeyxxx/npm-register",
        args: "-p 3000:3000 \
               -e NPM_REGISTER_STORAGE=fs \
               -e NPM_REGISTER_FS_DIRECTORY=./tmp \
               -e NPM_REGISTER_AUTH_WRITE=false \
               -e NPM_REGISTER_AUTH_READ=false"
    end
    node.vm.network "forwarded_port", guest: 3000, host: 3000
    node.vm.network :private_network, :ip => "192.168.0.10"
  end
end
