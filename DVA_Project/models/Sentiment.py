from __future__ import division
from math import log, exp
from operator import mul
import os
import pylab
import cPickle

class MyDict(dict):
	def __getitem__(self, key):
		if key in self:
			return self.get(key)
		return 0
		
class SentimentLearner(object):

	class MyDict(dict):
		def __getitem__(self, key):
			if key in self:
				return self.get(key)
			return 0
		
	def train(self):
		# global pos, neg, totals
		retrain = False
		
		# Load counts if they already exist.
		if not retrain and os.path.isfile(self.CDATA_FILE):
			# cPickle.load(open(self.CDATA_FILE))
			self.pos, self.neg, self.totals = cPickle.load(open(self.CDATA_FILE))
			return

		limit = 12500
		for file in os.listdir("./aclImdb/train/pos")[:limit]:
			for word in set(self.negate_sequence(open("./aclImdb/train/pos/" + file).read())):
				self.pos[word] += 1
				self.neg['not_' + word] += 1
		for file in os.listdir("./aclImdb/train/neg")[:limit]:
			for word in set(self.negate_sequence(open("./aclImdb/train/neg/" + file).read())):
				self.neg[word] += 1
				self.pos['not_' + word] += 1
		
		self.prune_features()

		self.totals[0] = sum(self.pos.values())
		self.totals[1] = sum(self.neg.values())
		
		self.countdata = (self.pos, self.neg, self.totals)
		cPickle.dump(self.countdata, open(self.CDATA_FILE, 'w'))
		
	def prune_features(self):
		"""
		Remove features that appear only once.
		"""
		# global pos, neg
		for k in self.pos.keys():
			if self.pos[k] <= 1 and self.neg[k] <= 1:
				del self.pos[k]

		for k in self.neg.keys():
			if self.neg[k] <= 1 and self.pos[k] <= 1:
				del self.neg[k]
		
	def classify_text(self,text):
		words = set(word for word in self.negate_sequence(text) if word in self.pos or word in self.neg)
		if (len(words) == 0): 
			#print "No features to compare on"
			return 0

		pprob, nprob = 0, 0
		for word in words:
			pp = log((self.pos[word] + 1) / (2 * self.totals[0]))
			np = log((self.neg[word] + 1) / (2 * self.totals[1]))
			# print "%15s %.9f %.9f" % (word, exp(pp), exp(np))
			pprob += pp
			nprob += np

		#print ("Positive" if pprob > nprob else "Negative"), "log-diff = %.9f" % abs(pprob - nprob)
		return (pprob - nprob)
		
	def negate_sequence(self,text):
		"""
		Detects negations and transforms negated words into "not_" form.
		"""
		negation = False
		delims = "?.,!:;"
		result = []
		words = text.split()
		prev = None
		pprev = None
		for word in words:
			# stripped = word.strip(delchars)
			stripped = word.strip(delims).lower()
			negated = "not_" + stripped if negation else stripped
			result.append(negated)
			if prev:
				bigram = prev + " " + negated
				result.append(bigram)
				if pprev:
					trigram = pprev + " " + bigram
					result.append(trigram)
				pprev = prev
			prev = negated

			if any(neg in word for neg in ["not", "n't", "no"]):
				negation = not negation

			if any(c in word for c in delims):
				negation = False

		return result

	def get_dictionaries(self):
		return self.pos, self.neg
	
	def __init__(self):
		self.pos = MyDict()
		self.neg = MyDict()
		self.features = set()
		self.totals = [0, 0]
		self.delchars = ''.join(c for c in map(chr, range(128)) if not c.isalnum())

		self.CDATA_FILE = "countdata.pickle"
		self.FDATA_FILE = "reduceddata.pickle"
		self.train()
