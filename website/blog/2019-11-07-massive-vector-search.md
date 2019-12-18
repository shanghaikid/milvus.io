---
title: 大规模向量检索
author: 莫毅华
---

# 大规模向量检索
## （一）什么是向量检索？

我们知道，计算机只是一个电子设备的集合体，它没法像人一样感知这个世界。怎样使得计算机也能认识这个世界呢？计算机只认识数字，它只能通过数字来量化这个世界，用一组数字来表示一个事物，这样的一组数字就是一个向量（vector）。如果一个向量由 n 个数字组成，它就是一个n维向量。拿目前广泛使用的人脸识别技术来说，计算机从照片或视频中提取出人脸的图像，然后将人脸图像转换为128维或者更高维度的向量。

那向量检索又是什么意思？我们先来复习一下初中的几何数学，在二维平面 XY 上有若干个点，A (1.0, 2.0)、B (1.0, 0.0)、C (0.0, 2.0)，试问 A 离谁比较近一些？

![vector](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/vector.png)

这里 ABC 就是三个二维向量，根据欧几里德数学知识，它们之间的距离可以通过如下公式计算（欧氏距离，Euclidean Distance）：

![Euclideandistance](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/ED.png)

可以得出 AB 距离为2, AC 距离为1,因此我们知道 A 离 C 更近一些。这就是一个最简单的向量检索，我们通过计算获知向量 A 离 C 更近，而 AC 距离更近意味着向量 A 和向量 C 更相似。另外，判断向量相似度的还有个余弦距离，两者的区别是余弦距离要求向量做过归一化处理，这里就不再描述，有兴趣的可以自己去复习一下。

相应的，对于高维向量，假设用 A 和 B 分别代表两个 n 维向量，它们之间的欧式距离计算公式就是：

![formula](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/formula.png)

回到人脸识别问题，假设我们已有一千万张人脸的向量数据，现在给定一张人脸，怎么在这一千万张人脸中找到与目标人脸最相似的人脸？根据上面的知识，我们只需要把这张人脸的向量和一千万张人脸向量分别计算欧氏距离，距离最小的就是最相似的。

向量检索有两个基本参数，一个是 n，意思是拿 n 条目标向量去数据库中做检索。另一个是 k，意思是查找离目标向量最近的前 k 个向量，我们一般称为 top-k。

向量检索有两类方法 ：存在最近邻检索（Nearest Neighbor Search，NN）和近似最近邻检索（Approximate Nearest Neighbor Search， ANN）。NN 最初是用目标向量和数据库向量逐条计算距离，结果最为精确，后来又产生了相关算法（比如 KD-tree），使得搜索效率大为提高，但在应对海量高维度数据时显得力不从心。ANN 则是在可接受的精度条件下通过把向量分簇建立索引，大幅提高搜索效率，这也大规模向量检索场景下所使用的主要方法。

怎么理解这里的分簇索引呢？打个比方，我们先给一个城市里所有的人按照职业做一个分类，比如工程师、律师、医生等等。现在我要找一个人，他是 Java 程序员，那么我们掐指一算，只要在工程师队伍里找就十有八九能找到他，不需要再去其他队伍里找了。

![persona](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/persona.png)

向量检索中典型的做法就是通过某种聚类算法把大批向量分成很多簇， 每个簇含有成百上千条向量，每个簇都有一个中心向量，当用户输入目标向量搜索时，系统先把目标向量和每个簇的中心向量做距离计算，挑选出距离比较近的几个簇，然后再把目标向量和这几个簇里的每一条向量做距离运算，最后得出距离最近的k条结果向量。

用简图来表示，假设我们有二维平面上若干个向量（点）：

![2d](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/2d.png)

通过聚类算法把它们分成若干个簇，簇的数量是可以指定的，这里分成4簇，黑圈的表示簇的中心向量：

![quantize1](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/quantize1.png)

加入要检索的目标向量，根据对比计算，我们发现它离黄色簇的中心最近，那么只需要将目标向量和黄色簇里每一个向量计算距离，就可以得到离目标向量最近的那个向量：

![quantize2](https://raw.githubusercontent.com/milvus-io/www.milvus.io/master/website/blog/assets/quantize2.png)

当然，具体到实现环节会有很多种不同做法，有基于矢量量化的，基于图的，以及基于树的各种算法，有兴趣的可以去搜索 ANN 相关论文。

## （二）大规模向量检索面临的问题

大规模向量检索的系统作为一个向量数据库，不但要能够支持海量数据的持久化，还要能快速地检索出用户需要的信息。生产环境中的向量维度一般起步就是128维，高一些的可达512维。我们可以算一下，对于512维度的向量，每条向量有512个数值，通常在计算机里这些数值是以 float 类型表示，这意味着每条向量将会占用2048字节，那么一亿条这样的向量就会用掉200 GB。而生产环境中的向量数量有可能达到十亿甚至百亿的规模。

根据使用的场景，可以分为静态库和增量库。静态库就是数据固定不变的，一旦完成数据导入，基本不会再接收新的数据，这种场景主要注重检索的性能；增量库在用户使用向量检索的过程中可能还伴随着持续的数据插入，需要考虑的问题要多一些，比如数据插入后多久可见，怎样兼顾检索效率和插入效率，如何保证宕机数据不丢失等等。

目前，用于向量检索的最热门工具是 Facebook 开源的 FAISS 向量搜索库，另外，微软也开源了一个 SPTAG 库。用户可以无需深入了解向量聚类和向量相似性计算的算法，就能使用这些库实现简单的向量检索。但是这些只是最基础的工具库，其功能并不包括对向量数据的管理，不具备高可用性，缺乏监控手段，没有提供分布式方案，以及缺少各种语言版本的 SDK 等等，这也使得用户需要基于它们进行大量的开发才能满足生产环境的要求。
