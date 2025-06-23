-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 23/06/2025 às 13:37
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `snmp_scanner`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `icl9e3gdi9`
--

CREATE TABLE `icl9e3gdi9` (
  `id` int(11) NOT NULL,
  `cliente` varchar(255) NOT NULL,
  `ip` text DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `page_count` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `icl9e3gdi9`
--

INSERT INTO `icl9e3gdi9` (`id`, `cliente`, `ip`, `serial`, `description`, `page_count`, `created_at`) VALUES
(1, 'TESTE 1', '192.168.0.85, 192.168.0.156, 192.168.0.159', NULL, NULL, NULL, '2025-03-19 13:21:11'),
(2, 'TESTE 1', '192.168.0.85', 'C727MA10061', 'RICOH MP C3504ex 1.29 / RICOH Network Printer C model / RICOH Network Scanner C model', 23512, '2025-03-19 13:24:27'),
(3, 'TESTE 1', '192.168.0.156', '3089RC00183', 'RICOH IM C2000 6.19 / RICOH Network Printer C model / RICOH Network Scanner C model', 6053, '2025-03-19 13:47:33'),
(4, 'TESTE 1', '192.168.0.159', 'KNDX03889', 'Canon GX7000 series /P', 3289, '2025-03-19 17:12:15');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `icl9e3gdi9`
--
ALTER TABLE `icl9e3gdi9`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `icl9e3gdi9`
--
ALTER TABLE `icl9e3gdi9`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
